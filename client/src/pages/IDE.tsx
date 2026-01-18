import Editor from "@monaco-editor/react";
import { useState } from "react";
import { Play, Save, Download, Code2, Terminal, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const LANGUAGE_TEMPLATES: Record<string, { label: string; extension: string; template: string }> = {
  python: {
    label: "Python",
    extension: "py",
    template: `# Python Playground
# Start coding here!

def main():
    print("Hello, World!")
    
    # Example: Sum of numbers
    numbers = [1, 2, 3, 4, 5]
    total = sum(numbers)
    print(f"Sum: {total}")

if __name__ == "__main__":
    main()
`,
  },
  javascript: {
    label: "JavaScript",
    extension: "js",
    template: `// JavaScript Playground
// Start coding here!

function main() {
  console.log("Hello, World!");
  
  // Example: Array operations
  const numbers = [1, 2, 3, 4, 5];
  const doubled = numbers.map(n => n * 2);
  console.log("Doubled:", doubled);
}

main();
`,
  },
  typescript: {
    label: "TypeScript",
    extension: "ts",
    template: `// TypeScript Playground
// Start coding here!

interface Person {
  name: string;
  age: number;
}

function greet(person: Person): string {
  return \`Hello, \${person.name}! You are \${person.age} years old.\`;
}

const user: Person = { name: "Coder", age: 25 };
console.log(greet(user));
`,
  },
  html: {
    label: "HTML",
    extension: "html",
    template: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    h1 { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start building your web page here.</p>
</body>
</html>
`,
  },
  css: {
    label: "CSS",
    extension: "css",
    template: `/* CSS Playground */
/* Style your web pages here! */

:root {
  --primary: #3b82f6;
  --secondary: #10b981;
  --background: #0f172a;
  --foreground: #f8fafc;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: system-ui, sans-serif;
}

.button {
  background: var(--primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.button:hover {
  background: var(--secondary);
}
`,
  },
  sql: {
    label: "SQL",
    extension: "sql",
    template: `-- SQL Playground
-- Practice your database queries here!

-- Create a table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com');

-- Query data
SELECT * FROM users WHERE name LIKE 'A%';

-- Join example
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.name;
`,
  },
  java: {
    label: "Java",
    extension: "java",
    template: `// Java Playground
// Start coding here!

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Example: Array operations
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int n : numbers) {
            sum += n;
        }
        System.out.println("Sum: " + sum);
    }
}
`,
  },
  cpp: {
    label: "C++",
    extension: "cpp",
    template: `// C++ Playground
// Start coding here!

#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello, World!" << std::endl;
    
    // Example: Vector operations
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum: " << sum << std::endl;
    
    return 0;
}
`,
  },
};

export default function IDE() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.python.template);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(LANGUAGE_TEMPLATES[newLang].template);
    setOutput("");
  };

  const handleReset = () => {
    setCode(LANGUAGE_TEMPLATES[language].template);
    setOutput("");
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput("Compiling and executing...\n");

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock execution based on language
    let result = "";
    try {
      if (language === "python" || language === "javascript" || language === "typescript") {
        if (code.includes("print") || code.includes("console.log")) {
          result = "Hello, World!\n";
          if (code.includes("sum") || code.includes("Sum")) {
            result += "Sum: 15\n";
          }
          if (code.includes("doubled") || code.includes("Doubled")) {
            result += "Doubled: [2, 4, 6, 8, 10]\n";
          }
          result += "\nProcess finished with exit code 0";
        } else {
          result = "No output generated.\n\nProcess finished with exit code 0";
        }
      } else if (language === "html") {
        result = "HTML Preview:\n\n[Rendered HTML page]\nTitle: My Page\nContent: Hello, World!\n\nPage rendered successfully.";
      } else if (language === "css") {
        result = "CSS Validation:\n\nNo syntax errors found.\nVariables defined: 4\nSelectors: 3\n\nStyles compiled successfully.";
      } else if (language === "sql") {
        result = "Query Results:\n\n| id | name  | email            |\n|----|-------|------------------|\n| 1  | Alice | alice@example.com|\n| 2  | Bob   | bob@example.com  |\n\n2 rows returned.";
      } else {
        result = "Hello, World!\nSum: 15\n\nProcess finished with exit code 0";
      }
    } catch (e) {
      result = `Error: ${e}\n\nProcess finished with exit code 1`;
    }

    setOutput(result);
    setIsRunning(false);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playground.${LANGUAGE_TEMPLATES[language].extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#1e1e1e]">
      <div className="h-14 bg-card border-b border-border flex items-center px-4 justify-between gap-4">
        <div className="flex items-center gap-4">
          <Code2 className="w-5 h-5 text-primary" />
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px] bg-muted border-border" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_TEMPLATES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <span className="text-xs text-muted-foreground hidden md:block">
            playground.{LANGUAGE_TEMPLATES[language].extension}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="text-xs"
            data-testid="button-reset"
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload}
            className="text-xs"
            data-testid="button-download"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button 
            onClick={handleRun}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-run"
          >
            <Play className={cn("h-4 w-4 mr-1", isRunning && "animate-pulse")} />
            {isRunning ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 relative border-r border-border min-h-[300px]">
          <Editor
            height="100%"
            language={language === "cpp" ? "cpp" : language}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              padding: { top: 16 },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
            }}
          />
        </div>

        <div className="h-[200px] lg:h-full lg:w-[400px] bg-[#111] flex flex-col">
          <div className="bg-[#252526] px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-[#333] flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            Output
          </div>
          <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
            {output || (
              <span className="text-gray-600 italic flex items-center gap-2">
                <Play className="w-4 h-4" />
                Click "Run" to execute your code...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
