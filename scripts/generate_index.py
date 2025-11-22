#!/usr/bin/env python3
"""
Auto-generate index files for n8n-copilot documentation

This script scans all documentation files and automatically generates
README.md index files with tables of contents, metadata summaries,
and navigation links.

Usage:
    python generate_index.py [--dry-run]
"""

import os
import re
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

class DocumentationIndexer:
    def __init__(self, root_dir: str = "."):
        self.root_dir = Path(root_dir)
        self.docs_dir = self.root_dir / "docs"
        
    def extract_metadata(self, file_path: Path) -> Optional[Dict]:
        """Extract YAML frontmatter metadata from markdown file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check for YAML frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    metadata = yaml.safe_load(parts[1])
                    return metadata
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
        
        return None
    
    def scan_directory(self, directory: Path) -> List[Dict]:
        """Scan directory for markdown files and extract metadata"""
        files = []
        
        for file_path in directory.glob("*.md"):
            if file_path.name == "README.md":
                continue
                
            metadata = self.extract_metadata(file_path)
            if metadata:
                files.append({
                    'path': file_path,
                    'name': file_path.stem,
                    'metadata': metadata
                })
        
        return files
    
    def generate_table(self, files: List[Dict]) -> str:
        """Generate markdown table from file metadata"""
        if not files:
            return ""
        
        table = "| Workflow | Difficulty | Cost | Time | Description |\n"
        table += "|----------|-----------|------|------|-------------|\n"
        
        for file in sorted(files, key=lambda x: x['metadata'].get('difficulty', '')):
            meta = file['metadata']
            difficulty_emoji = {
                'Beginner': '🟢',
                'Intermediate': '🟡',
                'Advanced': '🔴'
            }.get(meta.get('difficulty', ''), '⚪')
            
            title = meta.get('title', file['name'])
            difficulty = f"{difficulty_emoji} {meta.get('difficulty', 'N/A')}"
            cost = meta.get('cost', 'N/A')
            time = meta.get('time', 'N/A')
            description = meta.get('description', 'No description')
            
            # Create relative link
            link = f"[{title}](./{file['path'].name})"
            
            table += f"| {link} | {difficulty} | {cost} | {time} | {description} |\n"
        
        return table
    
    def generate_index(self, directory: Path, title: str):
        """Generate README.md index for a directory"""
        files = self.scan_directory(directory)
        
        if not files:
            print(f"No files found in {directory}")
            return
        
        # Generate index content
        content = f"# {title}\n\n"
        content += f"> 📅 Last Updated: {datetime.now().strftime('%Y-%m-%d')}  \n"
        content += f"> 🎯 Auto-generated index\n\n"
        content += "---\n\n"
        content += "## 📋 Available Workflows\n\n"
        content += self.generate_table(files)
        content += "\n---\n\n"
        content += "*This index was auto-generated. Do not edit manually.*\n"
        
        # Write to README.md
        readme_path = directory / "README.md"
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Generated {readme_path}")
    
    def run(self, dry_run: bool = False):
        """Run the indexer on all documentation directories"""
        directories = [
            (self.docs_dir / "workflows" / "marketing", "Marketing Automation Workflows"),
            (self.docs_dir / "workflows" / "sales", "Sales Automation Workflows"),
            (self.docs_dir / "workflows" / "ai_agents", "AI Agent Workflows"),
            (self.docs_dir / "workflows" / "operations", "Operations Automation Workflows"),
            (self.docs_dir / "workflows" / "integrations", "Integration Workflows"),
        ]
        
        for directory, title in directories:
            if directory.exists():
                if dry_run:
                    print(f"Would generate index for: {directory}")
                else:
                    self.generate_index(directory, title)

if __name__ == "__main__":
    import sys
    
    dry_run = "--dry-run" in sys.argv
    
    indexer = DocumentationIndexer()
    indexer.run(dry_run=dry_run)
    
    print("\n✅ Index generation complete!")
