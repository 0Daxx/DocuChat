"""
Helper utilities for NLP pipeline testing.
Handles dynamic file discovery and basic validation.
"""
from pathlib import Path
from typing import List, Dict, Tuple

# Supported extensions for academic documents
SUPPORTED_EXTENSIONS = {'.pdf', '.docx', '.txt'}

def discover_sample_files(sample_dir: Path) -> List[Path]:
    """
    Dynamically discover all supported files in the sample directory.
    
    Args:
        sample_dir: Path to the directory containing sample files.
        
    Returns:
        List of Path objects for supported files.
    """
    if not sample_dir.exists():
        return []
    
    found_files = []
    for ext in SUPPORTED_EXTENSIONS:
        # Use glob to find all files with this extension
        found_files.extend(sample_dir.glob(f"*{ext}"))
    
    # Sort for consistent ordering during tests
    return sorted(found_files)

def get_file_type(file_path: Path) -> str:
    """
    Determine the file type based on extension.
    
    Args:
        file_path: Path to the file.
        
    Returns:
        File type string ('pdf', 'docx', 'txt') or None if unsupported.
    """
    ext = file_path.suffix.lower()
    if ext in SUPPORTED_EXTENSIONS:
        return ext[1:]  # Remove the dot
    return None

def validate_file_content(file_path: Path, min_size_bytes: int = 100) -> bool:
    """
    Basic validation to ensure file is not empty/corrupt.
    
    Args:
        file_path: Path to the file.
        min_size_bytes: Minimum expected file size.
        
    Returns:
        True if file seems valid, False otherwise.
    """
    try:
        if not file_path.exists():
            return False
        if file_path.stat().st_size < min_size_bytes:
            return False
        print(f"📄 Validating: {file_path.name}")
        return True
    except Exception:
        return False

if __name__ == "__main__":
    """Quick validation that helper functions work correctly."""
    print("\n🔧 Validating test_helper.py...")
    
    # Test discovery
    sample_dir = Path(__file__).parent / "sample_files"
    files = discover_sample_files(sample_dir)
    
    print(f"📁 Sample directory: {sample_dir}")
    print(f"📁 Directory exists: {sample_dir.exists()}")
    print(f"🔍 Found {len(files)} supported files:")
    
    for f in files:
        ftype = get_file_type(f)
        valid = validate_file_content(f)
        size = f.stat().st_size if f.exists() else 0
        status = "✅" if valid else "⚠️ INVALID"
        print(f"   {status} {f.name} ({ftype}, {size} bytes)")
    
    if not files:
        print("   ❌ No files found! Check that sample_files/ contains .pdf, .docx, or .txt files")
    
    print("\n✅ test_helper.py validation complete!\n")