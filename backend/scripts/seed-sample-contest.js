import { contestRepository } from '../src/modules/contests/contests.repository.js';
import { sectionRepository } from '../src/modules/sections/sections.repository.js';
import { questionRepository } from '../src/modules/questions/questions.repository.js';
import { participantsService } from '../src/modules/participants/participants.service.js';
import { assignmentsService } from '../src/modules/assignments/assignments.service.js';
import { teamsService } from '../src/modules/teams/teams.service.js';
import { CONTEST_STATUS } from '@codeathon/shared';
import { logger } from '../src/utils/logger.js';
import { env } from '../src/config/env.js';

export const seedSampleContest = async () => {
  try {
    const existing = await contestRepository.findOne({ title: 'HACKPRO National Assessment 2026' }) || await contestRepository.findOne({ title: 'National Collegiate Codeathon 2026' });
    if (existing) return existing;

    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000).toISOString(); // started 10m ago
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // ends tomorrow

    // 1. Create Contest
    const contest = await contestRepository.create({
      id: 'contest_sample_2026',
      title: 'HACKPRO National Assessment 2026',
      description: 'Algorithmic problem solving and multiple-choice assessment.',
      instructions: 'Please maintain fullscreen at all times. Tab switches and devtools are monitored. Submit each coding question after testing sample cases.',
      startTime,
      endTime,
      durationMinutes: 90,
      gracePeriodMinutes: 5,
      status: CONTEST_STATUS.LIVE,
      rubricId: 'rubric_balanced',
      shuffleQuestions: false,
      shuffleOptions: false,
      resultVisibility: 'immediate',
      proctorConfig: {
        enabled: true,
        detectTabSwitch: true,
        detectWindowBlur: true,
        blockCopyPaste: true,
        blockRightClick: true,
        enforceFullscreen: true,
        blockDevTools: true,
        blockPrintScreen: true,
        blockTextSelection: true,
        maxViolations: 5,
        violationAction: 'warn',
      },
      leaderboardConfig: {
        enabled: true,
        displayMode: 'with_names',
        topN: 50,
        freezeMinutesBeforeEnd: 0,
      },
      extensionSeconds: 0,
    });

    // 2. Create Section 1: MCQ Round
    const secMcq = await sectionRepository.create({
      id: 'sec_mcq_1',
      contestId: contest.id,
      title: 'Section 1: Computer Science Fundamentals (MCQ)',
      description: 'Test your understanding of data structures, complexity, and algorithmic design.',
      order: 1,
      sectionTimerMinutes: 0,
      canRevisit: true,
    });

    // MCQ Questions
    await questionRepository.create({
      contestId: contest.id,
      sectionId: secMcq.id,
      type: 'mcq',
      title: 'Time Complexity of Binary Search',
      statement: 'What is the worst-case time complexity of searching an element in a sorted array of size N using Binary Search?',
      marks: 5,
      negativeMarks: 1,
      order: 1,
      isMultiSelect: false,
      mcqOptions: [
        { id: 'opt_1_1', text: 'O(1)', isCorrect: false },
        { id: 'opt_1_2', text: 'O(log N)', isCorrect: true },
        { id: 'opt_1_3', text: 'O(N)', isCorrect: false },
        { id: 'opt_1_4', text: 'O(N log N)', isCorrect: false },
      ],
    });

    await questionRepository.create({
      contestId: contest.id,
      sectionId: secMcq.id,
      type: 'mcq',
      title: 'Balanced Binary Search Trees',
      statement: 'Which of the following self-balancing binary search trees guarantees that tree height is at most 1.44 * log2(N)?',
      marks: 5,
      negativeMarks: 1,
      order: 2,
      isMultiSelect: false,
      mcqOptions: [
        { id: 'opt_2_1', text: 'AVL Tree', isCorrect: true },
        { id: 'opt_2_2', text: 'Red-Black Tree', isCorrect: false },
        { id: 'opt_2_3', text: 'B-Tree', isCorrect: false },
        { id: 'opt_2_4', text: 'Splay Tree', isCorrect: false },
      ],
    });

    // 3. Create Section 2: Coding Challenges
    const secCoding = await sectionRepository.create({
      id: 'sec_coding_2',
      contestId: contest.id,
      title: 'Section 2: Algorithmic Programming',
      description: 'Implement correct and optimal solutions in Python, JavaScript, C++, or Java.',
      order: 2,
      sectionTimerMinutes: 0,
      canRevisit: true,
    });

    // Coding Question 1: Two Sum
    await questionRepository.create({
      contestId: contest.id,
      sectionId: secCoding.id,
      type: 'coding',
      title: 'Target Pair Index Sum',
      statement: 'Given a space-separated list of integers and a target sum T, output the 0-based indices of the two numbers that add up to T. You may assume exactly one solution exists.',
      marks: 20,
      negativeMarks: 0,
      order: 1,
      codingConfig: {
        inputFormat: 'Line 1: Space-separated integers representing array elements.\nLine 2: Single integer T.',
        outputFormat: 'Two space-separated integers representing the indices in ascending order.',
        examples: 'Input:\n2 7 11 15\n9\nOutput:\n0 1',
        constraints: '2 <= N <= 10^5\n-10^9 <= A[i] <= 10^9',
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        displayToggles: {
          showStatement: true,
          showInputFormat: true,
          showOutputFormat: true,
          showExamples: true,
          showConstraints: true,
          showLimits: true,
          showSampleTestCases: true,
          showHiddenTestCasesCount: true,
        },
        allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
        starterCode: {
          python: `import sys

def solve():
    data = sys.stdin.read().splitlines()
    if not data:
        return
    nums = [int(x) for x in data[0].split()]
    target = int(data[1].strip())
    
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            print(f"{seen[complement]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`,
          javascript: `const fs = require('fs');

function solve() {
  const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
  if (!lines || lines.length < 2) return;
  const nums = lines[0].trim().split(/\\s+/).map(Number);
  const target = Number(lines[1].trim());

  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      console.log(\`\${map.get(complement)} \${i}\`);
      return;
    }
    map.set(nums[i], i);
  }
}

solve();
`,
        },
        testCases: [
          {
            id: 'tc_sample_1',
            input: '2 7 11 15\n9',
            expectedOutput: '0 1',
            isSample: true,
            isHidden: false,
            weight: 5,
            explanation: 'nums[0] + nums[1] = 2 + 7 = 9',
          },
          {
            id: 'tc_sample_2',
            input: '3 2 4\n6',
            expectedOutput: '1 2',
            isSample: true,
            isHidden: false,
            weight: 5,
            explanation: 'nums[1] + nums[2] = 2 + 4 = 6',
          },
          {
            id: 'tc_hidden_1',
            input: '3 3\n6',
            expectedOutput: '0 1',
            isSample: false,
            isHidden: true,
            weight: 5,
            explanation: 'Handles duplicate elements correctly',
          },
          {
            id: 'tc_hidden_2',
            input: '-1 -2 -3 -4 -5\n-8',
            expectedOutput: '2 4',
            isSample: false,
            isHidden: true,
            weight: 5,
            explanation: 'Handles negative integers correctly',
          },
        ],
      },
    });

    // Coding Question 2: Valid Palindrome String
    await questionRepository.create({
      contestId: contest.id,
      sectionId: secCoding.id,
      type: 'coding',
      title: 'Alphanumeric Palindrome Check',
      statement: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Print "true" or "false".',
      marks: 20,
      negativeMarks: 0,
      order: 2,
      codingConfig: {
        inputFormat: 'A single line containing the string S.',
        outputFormat: 'Print "true" if palindrome, else "false".',
        examples: 'Input:\nA man, a plan, a canal: Panama\nOutput:\ntrue',
        constraints: '1 <= len(S) <= 2 * 10^5',
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        displayToggles: {
          showStatement: true,
          showInputFormat: true,
          showOutputFormat: true,
          showExamples: true,
          showConstraints: true,
          showLimits: true,
          showSampleTestCases: true,
          showHiddenTestCasesCount: true,
        },
        allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
        starterCode: {
          python: `import sys, re

def solve():
    s = sys.stdin.read().strip()
    filtered = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
    if filtered == filtered[::-1]:
        print("true")
    else:
        print("false")

if __name__ == '__main__':
    solve()
`,
          javascript: `const fs = require('fs');

function solve() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  const filtered = input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const reversed = filtered.split('').reverse().join('');
  console.log(filtered === reversed ? "true" : "false");
}

solve();
`,
        },
        testCases: [
          {
            id: 'tc_pal_1',
            input: 'A man, a plan, a canal: Panama',
            expectedOutput: 'true',
            isSample: true,
            isHidden: false,
            weight: 10,
          },
          {
            id: 'tc_pal_2',
            input: 'race a car',
            expectedOutput: 'false',
            isSample: true,
            isHidden: false,
            weight: 5,
          },
          {
            id: 'tc_pal_3',
            input: ' ',
            expectedOutput: 'true',
            isSample: false,
            isHidden: true,
            weight: 5,
          },
        ],
      },
    });

    // 4. Seed Participants
    const defaultStudentPassword = env.DEFAULT_STUDENT_PASSWORD || undefined;
    const p1 = await participantsService.createParticipant({
      rollNumber: 'CS2026001',
      name: 'Alex Johnson',
      email: 'student1@hackpro.dev',
      password: defaultStudentPassword,
      department: 'Computer Science',
    });

    const p2 = await participantsService.createParticipant({
      rollNumber: 'CS2026002',
      name: 'Priya Sharma',
      email: 'student2@hackpro.dev',
      password: defaultStudentPassword,
      department: 'Information Technology',
    });

    const team = await teamsService.createTeam({
      name: 'Byte Knights',
      description: 'Competitive programming squad',
      memberIds: [p1.id, p2.id],
    });

    // 5. Assign Participants to Contest
    await assignmentsService.assign(contest.id, [p1.id, p2.id], [team.id]);

    logger.info('Sample contest and participants seeded successfully!');
    return contest;
  } catch (err) {
    logger.error('Failed to seed sample contest', { error: err.message });
  }
};

if (process.argv[1]?.endsWith('seed-sample-contest.js')) {
  seedSampleContest().then(() => process.exit(0));
}
