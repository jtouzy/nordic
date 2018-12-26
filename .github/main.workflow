workflow "Test workflow on push" {
  on = "push"
  resolves = ["NPM Test"]
}

action "NPM Test" {
  uses = "actions/npm@e7aaefe"
  runs = "npm run test"
}
