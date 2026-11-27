export const SUPPORTED_LANGUAGES = {
    python: {
        id: 'python',
        name: 'Python (v3.12)',
        extension: 'py',
        defaultStarterCode: `import sys

def solve():
    # Read input from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Write your solution here
    print("Hello, HACKPRO!")

if __name__ == '__main__':
    solve()
`,
    },
    javascript: {
        id: 'javascript',
        name: 'JavaScript (Node.js)',
        extension: 'js',
        defaultStarterCode: `const fs = require('fs');

function solve() {
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (!input) return;
  // Write your solution here
  console.log("Hello, HACKPRO!");
}

solve();
`,
    },
    java: {
        id: 'java',
        name: 'Java (JDK 21 LTS)',
        extension: 'java',
        defaultStarterCode: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
        System.out.println("Hello, HACKPRO!");
    }
}
`,
    },
    csharp: {
        id: 'csharp',
        name: 'C# (.NET / Roslyn)',
        extension: 'cs',
        defaultStarterCode: `using System;

class Program {
    static void Main(string[] args) {
        // Write your solution here
        Console.WriteLine("Hello, HACKPRO!");
    }
}
`,
    },
};
export const LANGUAGE_KEYS = Object.keys(SUPPORTED_LANGUAGES);
