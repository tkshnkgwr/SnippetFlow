**English** | [日本語版](../ja/SECURITY.md)

# Security Policy (SECURITY.md) - SnippetFlow

This document summarizes the security design principles, supported versions, and vulnerability reporting procedures for the `SnippetFlow` project.

---

## 1. Security Design and Safety

`SnippetFlow` guarantees high security and reliability through the following design principles:

1. **Local-First Operations**:
   - The application does not communicate with external servers. All registered snippet data (`snippets.json`) and configuration files (`settings.json`) are stored strictly on the user's local filesystem.
   - Backup imports and exports are processed entirely locally via OS-native file dialogs.
2. **Memory Safety**:
   - The backend and egui standalone versions are built with Rust. Leveraging Rust's strong ownership system and compile-time memory management, it eliminates critical memory safety vulnerabilities such as buffer overflows and null pointer dereferences.
3. **Sandbox & Secure Bridge**:
   - In the Tauri environment, the frontend (React/HTML) and backend (Rust) communicate exclusively through a secure IPC (Inter-Process Communication) bridge. The Webview context is isolated to prevent unauthorized execution of system commands.
4. **XSS (Cross-Site Scripting) Prevention**:
   - Standard React escaping and secure markup rendering are strictly applied to all text displays and diff comparison views (LCS) in the frontend to prevent the execution of malicious scripts.

---

## 2. Supported Versions

Security updates are provided for the following versions:

| Version                 | Support Status |
| :---------------------- | :------------: |
| Latest Release (`v1.9.x`)| ✅ Supported   |
| Older Releases          | ❌ Unsupported |

---

## 3. Reporting a Vulnerability

If you discover a potential security vulnerability in `SnippetFlow`, please do not create a public Issue. Instead, report it using the following steps:

1. **Contact Point**:
   - Contact the repository maintainer directly (accessible via Issues/PRs) or use private channels.
2. **Details to Include**:
   - Affected `SnippetFlow` version and OS environment (Windows 10/11, etc.).
   - Whether it affects the egui, Tauri, or React Web version.
   - Details of the vulnerability and steps to reproduce (including JSON data or steps if applicable).
3. **Response Process**:
   - Upon receiving a report, we will verify the vulnerability, prepare a fix, and release an updated version as soon as possible.
