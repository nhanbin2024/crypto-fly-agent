#!/bin/bash

# Detect the operating system
OS=$(uname)

# Function to check if Python 3.9 is installed
check_python_installed() {
    if command -v python3.9 &>/dev/null; then
        echo "Python 3.9 is already installed."
    else
        echo "Python 3.9 is not installed."
        install_python
    fi
}

install_python() {
    case "$OS" in
        Linux*) install_python_linux ;;
        Darwin*) install_python_macos ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*) install_python_windows ;;
        *) echo "Unsupported operating system: $OS"; exit 1 ;;
    esac
}

# Function to install Python on Linux
install_python_linux() {
    # Attempt to install Python (example for Ubuntu/Debian-based systems)
    sudo apt-get update
    sudo apt-get install -y python3.9
    if [ $? -eq 0 ]; then
        echo "Python 3.9 has been successfully installed."
    else
        echo "Failed to install Python 3.9. Please install Python 3.9 manually."
        exit 1
    fi
}

# Function to install Python on macOS using Homebrew
install_python_macos() {
    # Attempt to install Python using Homebrew
    brew install python@3.9
    if [ $? -eq 0 ]; then
        echo "Python 3.9 has been successfully installed."
    else
        echo "Failed to install Python 3.9. Please install Python 3.9 manually using Homebrew."
        exit 1
    fi
}

# Function to install Python on Windows
install_python_windows() {
    # Attempt to download and install Python
    curl -o python_installer.exe https://www.python.org/ftp/python/3.9.0/python-3.9.0-amd64.exe
    python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
    if [ $? -eq 0 ]; then
        echo "Python 3.9 has been successfully installed."
    else
        echo "Failed to install Python 3.9. Please install Python 3.9 manually from https://www.python.org/downloads/"
        exit 1
    fi
}

install_treesitter() {
    if python3.9 -c "import treesitter" &>/dev/null; then
        echo "Tree-sitter for Python is already installed."
    else
        echo "Installing Tree-sitter for Python..."
        python3.9 -m pip install -r server/requirements.txt
        cd server
        python3.9 -m bot
        if [ $? -eq 0 ]; then
            echo "Tree-sitter for Python has been successfully installed."
        else
            echo "Failed to install Tree-sitter for Python. Please install it manually using 'pip install treesitter'."
            exit 1
        fi
    fi
}

case "$OS" in
    Linux*) check_python_installed && install_treesitter ;;
    Darwin*) check_python_installed && install_treesitter ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*) check_python_installed && install_treesitter ;;
    *) echo "Unsupported operating system: $OS"; exit 1 ;;
<<<<<<< HEAD
esac
=======
esac
>>>>>>> main
