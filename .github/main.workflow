workflow "Unit-test on push" {
  on = "push"
  resolves = [
    "NPM Test"
  ]
}

action "NPM Install" {
  uses = "actions/npm@e7aaefe"
  runs = "npm install"
}

action "NPM Test" {
  uses = "actions/npm@e7aaefe"
  runs = "npm run test"
  needs = [
    "NPM Install"
  ]
}
