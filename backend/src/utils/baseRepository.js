import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { logger } from './logger.js';

// Global registry of all instantiated repositories to sync when MongoDB connects
const repositoryRegistry = new Set();

mongoose.connection.on('connected', async () => {
  for (const repo of repositoryRegistry) {
    try {
      await repo.syncWithMongo();
    } catch (e) {
      logger.warn(`Failed to sync ${repo.name} with MongoDB: ${e.message}`);
    }
  }
});

export class BaseRepository {
  constructor(name, mongooseModel = null) {
    this.name = name;
    this.mongooseModel = mongooseModel;
    this.items = new Map(); // id -> item (fast memory cache)
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, `${this.name}.json`);
    this._saveTimer = null;

    repositoryRegistry.add(this);

    // 1. Immediately load local persisted file data on startup
    this.loadFromFile();

    // 2. If MongoDB is already connected, sync immediately
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      this.syncWithMongo().catch(() => {});
    }
  }

  loadFromFile() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        if (raw && raw.trim().length > 0) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            for (const item of list) {
              const id = String(item.id || item._id);
              if (id) {
                this.items.set(id, { ...item, id, _id: id });
              }
            }
          }
        }
      }
    } catch (err) {
      logger.warn(`Could not load local data for ${this.name}: ${err.message}`);
    }
  }

  saveToFile() {
    // Skip blocking local disk writes when MongoDB is actively connected (avoids event-loop stalls at 1,000+ users)
    if (mongoose.connection && mongoose.connection.readyState === 1 && process.env.NODE_ENV !== 'test') {
      return;
    }
    if (process.env.NODE_ENV === 'test') {
      this._writeFileSyncNow();
      return;
    }
    // Debounce non-blocking async file persistence in in-memory fallback mode
    if (this._saveTimer) return;
    this._saveTimer = setTimeout(async () => {
      this._saveTimer = null;
      try {
        if (!fs.existsSync(this.dataDir)) {
          await fs.promises.mkdir(this.dataDir, { recursive: true });
        }
        const list = Array.from(this.items.values());
        await fs.promises.writeFile(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
      } catch (err) {
        logger.warn(`Could not save local data for ${this.name}: ${err.message}`);
      }
    }, 200);
  }

  _writeFileSyncNow() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const list = Array.from(this.items.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      logger.warn(`Could not save local data for ${this.name}: ${err.message}`);
    }
  }

  async syncWithMongo() {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) return;
    try {
      const col = mongoose.connection.collection(this.name);
      const docs = await col.find({}).toArray();

      // Load docs from MongoDB into items
      for (const doc of docs) {
        const id = String(doc.id || doc._id);
        if (id) {
          // If in memory doesn't have it or doc is newer, set it
          this.items.set(id, { ...doc, id, _id: id });
        }
      }

      // If items has records that are not in MongoDB yet, insert them
      const mongoIds = new Set(docs.map((d) => String(d.id || d._id)));
      for (const [id, item] of this.items.entries()) {
        if (!mongoIds.has(id)) {
          await col.updateOne({ id }, { $set: item }, { upsert: true });
        }
      }

      this.saveToFile();
    } catch (err) {
      logger.warn(`Error during MongoDB sync for ${this.name}: ${err.message}`);
    }
  }

  async find(query = {}) {
    const list = Array.from(this.items.values());
    return list.filter((item) => {
      for (const [key, val] of Object.entries(query)) {
        if (Array.isArray(val)) {
          if (!val.includes(item[key])) return false;
        } else if (typeof val === 'object' && val !== null) {
          if (val.$in && !val.$in.includes(item[key])) return false;
          if (val.$ne && item[key] === val.$ne) return false;
          if (val.$regex && !new RegExp(val.$regex, val.$options || 'i').test(item[key])) return false;
        } else if (item[key] !== val && String(item[key]) !== String(val)) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const matches = await this.find(query);
    return matches.length > 0 ? { ...matches[0] } : null;
  }

  async findById(id) {
    if (!id) return null;
    let item = this.items.get(String(id));
    if (!item) {
      for (const val of this.items.values()) {
        if (String(val.id) === String(id) || String(val._id) === String(id)) {
          item = val;
          break;
        }
      }
    }
    return item ? { ...item } : null;
  }

  async create(data) {
    const id = data.id || data._id || uuidv4();
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: String(id),
      _id: String(id),
      createdAt: data.createdAt || now,
      updatedAt: now,
    };
    this.items.set(String(id), item);
    this.saveToFile();

    // Async persist to MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const col = mongoose.connection.collection(this.name);
        const filter = {
          $or: [{ id: String(id) }, { _id: String(id) }],
        };
        if (mongoose.Types.ObjectId.isValid(String(id))) {
          filter.$or.push({ _id: new mongoose.Types.ObjectId(String(id)) });
        }
        await col.updateOne(filter, { $set: item }, { upsert: true });
      } catch (err) {
        logger.warn(`Failed to persist created ${this.name} to MongoDB: ${err.message}`);
      }
    }

    return { ...item };
  }

  async update(id, updates) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id: String(id),
      _id: String(id),
      updatedAt: new Date().toISOString(),
    };
    this.items.set(String(id), updated);
    this.saveToFile();

    // Async persist to MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const col = mongoose.connection.collection(this.name);
        const filter = {
          $or: [{ id: String(id) }, { _id: String(id) }],
        };
        if (mongoose.Types.ObjectId.isValid(String(id))) {
          filter.$or.push({ _id: new mongoose.Types.ObjectId(String(id)) });
        }
        await col.updateOne(filter, { $set: updated }, { upsert: true });
      } catch (err) {
        logger.warn(`Failed to persist updated ${this.name} to MongoDB: ${err.message}`);
      }
    }

    return { ...updated };
  }

  async delete(id) {
    if (!id) return false;
    const strId = String(id);
    let deleted = this.items.delete(strId);
    for (const [k, v] of this.items.entries()) {
      if (String(v.id) === strId || String(v._id) === strId) {
        this.items.delete(k);
        deleted = true;
      }
    }
    this.saveToFile();

    // Async persist to MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const col = mongoose.connection.collection(this.name);
        const queries = [{ id: strId }, { _id: strId }];
        if (mongoose.Types.ObjectId.isValid(strId)) {
          queries.push({ _id: new mongoose.Types.ObjectId(strId) });
        }
        await col.deleteOne({ $or: queries });
      } catch (err) {
        logger.warn(`Failed to delete ${this.name} from MongoDB: ${err.message}`);
      }
    }

    return deleted;
  }

  async deleteMany(query = {}) {
    const matches = await this.find(query);
    let count = 0;
    for (const item of matches) {
      const id = item.id || item._id;
      if (id) {
        await this.delete(id);
        count++;
      }
    }
    return count;
  }

  async count(query = {}) {
    const matches = await this.find(query);
    return matches.length;
  }

  async clear() {
    this.items.clear();
    this.saveToFile();
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const col = mongoose.connection.collection(this.name);
        await col.deleteMany({});
      } catch (err) {
        logger.warn(`Failed to clear ${this.name} in MongoDB: ${err.message}`);
      }
    }
  }
}
