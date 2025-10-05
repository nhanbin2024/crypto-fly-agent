# Sixth AI User Guide

Welcome to the Sixth AI extension! This guide introduces the features and functionalities available in Sixth AI, helping you navigate and make the most of the extension. Sixth AI is designed to streamline your development process, enhance code understanding, and increase productivity.

---

## Table of Contents

- [Features Overview](#features-overview)
- [Feature Details and Usage Guide](#feature-details-and-usage-guide)
  - [1. Sixth AI Chat & Composer](#1-sixth-ai-chat--composer)
    - [1.1 CodeLens Integration](#11-codelens-integration)
    - [1.2 Composer](#12-composer)
  - [2. Code Base Indexing](#2-code-base-indexing)
  - [3. Inline Chat](#3-inline-chat)
  - [4. See Terminal](#4-see-terminal)
- [Conclusion](#conclusion)

---

## Features Overview

1. **Sixth AI Chat & Composer**  
   A powerful AI code assistant chat with added functionalities like CodeLens integration and Composer for multi-file editing and creation. Composer is fully fused with chat, allowing seamless editing and file management within the chat interface.

2. **Code Base Indexing**  
   Enables indexing your entire codebase for improved AI context and support.

3. **Inline Chat**  
   Provides an inline editing chat experience for highlighted code within the editor.

4. **See Terminal**  
   Automatically generates terminal commands based on prompts.

---

## Feature Details and Usage Guide

### 1. Sixth AI Chat & Composer

**Introduction:**  
The Sixth AI Chat is a robust AI assistant capable of answering questions, generating code snippets, and improving code quality. It integrates seamlessly with your workspace and includes the **Composer** feature for handling multi-file edits efficiently within the chat experience.

**Key Functionalities:**
- **CodeLens Integration:** Click any of the CodeLens above a function or method in the editor to perform specific tasks, such as explaining code, debugging issues, generating docstrings, or creating unit tests. The response will appear in the Sixth AI Chat panel, providing detailed and actionable insights tailored to your selected task.


- **Composer:** Composer is integrated directly within the Sixth AI Chat, allowing you to edit and create multiple files seamlessly in a single interaction.

#### 1.1 CodeLens Integration

**Introduction:**  
CodeLens Integration enables quick code based actions like debuging and explaining code directly within your editor.

**How to Use:**
1. Click any of the CodeLens above any code block.
2. View the response in the Sixth AI Chat panel.

<img src="https://github.com/precious112/Pstore_backend/blob/master/media/media/codelans.png?raw=true" alt="Codelens Intro Image" width="700">

#### 1.2 Composer

**Introduction:**  
The Composer allows you to edit and create multiple files in one prompt, expediting your development workflow. It is fully integrated into the chat interface, making it easy to work on multiple files without leaving the chat.

**How to Use:**
1. Open the **Sixth AI Chat** and type a prompt that involves editing or creating multiple files.
2. The AI will automatically activate the **Composer** interface within the chat to assist with your request.
3. Add files that need to be edited by clicking the **Upload** button.
4. Once the files are uploaded, enter your editing prompt to specify the required changes. After the AI completes the edits, you can review the modifications by viewing the **diff**. Simply click on a file to see a detailed comparison of the original and edited versions.
5. For newly created files, view them as they are being written by the AI in real-time.
6. After reviewing all changes, you can **Apply all the changes** by clicking the apply button.

> **Note:** When using the Composer feature, we recommend creating a separate branch from your main branch. This allows you to safely experiment and easily roll back changes if necessary, ensuring your main branch remains stable.

![Chat & Composer](https://github.com/precious112/Pstore_backend/blob/master/media/media/edited_needed_one_edit-ezgif.com-optimize.gif?raw=true) 

---

### 2. Code Base Indexing

**Introduction:**  
Code Base Indexing scans your entire codebase and creates a searchable index for Sixth AI to use as context. This enhances the AI’s ability to answer questions and generate relevant code suggestions.

<img src="https://github.com/precious112/Pstore_backend/blob/master/media/media/Screenshot%202024-12-27%20at%204.26.59%20AM.png?raw=true" alt="Codebase Indexing" width="700">

---

### 3. Inline Chat

**Introduction:**  
The Inline Chat feature allows you to edit highlighted code directly in the editor, providing instant solutions and feedback.

**How to Use:**
1. Highlight the code snippet you want to edit.
2. Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Shift+I` (Mac).
3. Enter your query or command in the inline chat box.
4. Review and apply the AI’s suggestions.

![inline chat](https://github.com/precious112/Pstore_backend/blob/master/media/media/inline_chat_1-ezgif.com-video-to-gif-converter.gif?raw=true)

---

### 4. See Terminal

**Introduction:**  
The See Terminal feature generates terminal commands based on your input, simplifying repetitive tasks and reducing errors.

**How to Use:**
1. Press `Ctrl+Alt+T` (Windows/Linux) or `Cmd+option+T` (Mac) to activate.
2. Enter a description of the command you need (e.g., "create a new branch").
3. The AI will generate the appropriate command and display it in the terminal.
4. Run the command directly if it meets your requirements.

![terminal command](https://github.com/precious112/Pstore_backend/blob/master/media/media/ezgif.com-optimize%20(3).gif?raw=true)

---

## Conclusion

Thank you for using Sixth AI! We hope these features enhance your development experience. If you encounter issues or have suggestions, please reach out to our support team or visit our community forum. Happy coding!

