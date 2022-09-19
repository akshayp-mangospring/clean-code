### **Principles**:

* **DRY**: Logic once written must not be redefined anywhere in the system. It should just be reused.
What's logic in this case? In this case it's single source of truth, a piece of code which works really well with all the scenarios possible with that piece of code.
Expressions can be logic, functions can be logic.
Query once use everywhere. In case of `jQuery`.

* **Readability**:
Code read to write time must be 5:1.
Naming stuff - Assign names of cyptic and often non understandable code, comments - Use sparingly. Code should be readable enough to get rid of most comments, assign names to expressions to improve readability - Use functions in `if` conditions to improve readability.

* **Extract, Extract, Extract**:
Keep funcs really small so that it can be easy to alter and debug.
Funcs should do one thing well and it should do that only.
Treat funcs like boxes. It should have an expected i/p and an expected o/p. It should have handling of wrong args, error handling if required.

### **Workflow change**:
* Old workflow - Write first, make it work, forget about it.
* New workflow -
  * Search whether the logic is existent somewhere in the code,
  * Write if it's not there, make it work, refactor it immediately. While refactoring, refactor mercilessly and fearlessly.
  * Commit it and forget about it.
