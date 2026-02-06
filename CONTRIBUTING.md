# Contributing to SuiLoop

First off, thanks for taking the time to contribute! ❤️

All types of contributions are encouraged and valued. See the [Table of Contents](#table-of-contents) for different ways to help and details about how this project handles them.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [I Have a Question](#i-have-a-question)
- [I Want To Contribute](#i-want-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
- [Styleguides](#styleguides)
  - [Commit Messages](#commit-messages)

## Code of Conduct
This project and everyone participating in it is governed by the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/1/4/code-of-conduct). By participating, you are expected to uphold this code.

## I Have a Question
> If you want to ask a question, we assume that you have read the available [Documentation](TECHNICAL_DOCUMENTATION.md).

Before you ask a question, it is best to search for existing [Issues](https://github.com/Eras256/Sui-Loop/issues) that might help you. In case you have found a suitable issue and still need clarification, you can write your question in this issue. It is also advisable to search the internet for answers first.

## I Want To Contribute

### Reporting Bugs
- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the steps to reproduce the problem** in as much detail as possible.
- **Provide specific examples** to demonstrate the steps.
- **Describe the behavior you observed** after following the steps and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**

### Suggesting Enhancements
- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as much detail as possible.
- **Explain why this enhancement would be useful** to most SuiLoop users.

### Your First Code Contribution
1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally: `git clone https://github.com/your-username/Sui-Loop.git`
3.  **Create a branch** for your feature: `git checkout -b feature/amazing-feature`
4.  **Install dependencies**:
    ```bash
    ./install.sh
    ```
5.  **Make your changes**.
6.  **Test your changes** (See `TESTING.md`).
7.  **Commit your changes** following our style guide.
8.  **Push to the branch**: `git push origin feature/amazing-feature`
9.  **Submit a Pull Request**.

## Styleguides

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

*   `feat`: A new feature
*   `fix`: A bug fix
*   `docs`: Documentation only changes
*   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
*   `refactor`: A code change that neither fixes a bug nor adds a feature
*   `perf`: A code change that improves performance
*   `test`: Adding missing tests or correcting existing tests
*   `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

**Example:**
`feat(agent): add support for AWS Bedrock models`
