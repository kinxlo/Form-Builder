# Docs

- Setup: [`docs/setup.md`](docs/setup.md)
- Tests: [`docs/tests.md`](docs/tests.md)
- Workflow: [`docs/workflow.md`](docs/workflow.md)

## Approach and Trade off (Dynamic and static forms)

Dynamic forms: It’s super convenient because anytime the product requires a new form or extra fields, you don’t have to touch the UI much, you just update the schema and boom!, new form. Great when you’re dealing with lots of forms or clients that all want different things.

But the downside is that it can get complex to develop. Debugging becomes less straightforward because the form is more of a fomular (schema). And when product starts asking for special UI behavior, Everything refactor or adjustment is now dependant on the schema instead of just coding it normally.

Static forms: on the other hand, You write exactly what you need, the UI is clean, the flow is smooth, and it’s easier to control the experience. But every time the product UI changes, you have to go back into the code to edit/update it.

So it’s basically:

* **Dynamic forms = faster to scale and change, but harder to customize and debug**
* **Static forms = cleaner UX and easier control, but slower when forms keep changing**

P.S
 once you can see the pattern, it slightly becomes easier to work with.

