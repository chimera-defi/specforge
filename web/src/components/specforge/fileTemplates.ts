export const FILE_TEMPLATES: Record<string, { content: string; description: string }> = {
  "README.md": {
    content: `# Project Name

Brief description of the project.

## Overview
- What this project does
- Who it's for
- Key features

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`

## Contributing
Pull requests welcome.
`,
    description: "Standard README template",
  },
  "CHANGELOG.md": {
    content: `# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes
`,
    description: "Changelog template",
  },
  ".gitignore": {
    content: `node_modules/
dist/
.env
.DS_Store
*.log
`,
    description: "Git ignore template",
  },
  "package.json": {
    content: `{
  "name": "project-name",
  "version": "1.0.0",
  "description": "Description",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "MIT"
}
`,
    description: "Node.js package template",
  },
};