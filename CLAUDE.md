# Claude Development Guide

## Tools

- **Bun** is used ONLY as a package manager
- Use `dum` instead of `npm` to run scripts. E.g. `dum test` instead `dum run test`

## Running Tests

- **ALWAYS** use `dum test` to run tests
- **NEVER** run tests with `bun test` or any other command
