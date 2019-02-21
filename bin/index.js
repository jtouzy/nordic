#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const readline = require('readline')
const Nordic = require('../src/Nordic')

const nordic = new Nordic()

const interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const askForOption = (option, nextIndex, options, object, callback) => {
  interface.question(option.text, (answer) => {
    const answers = Object.assign({}, object, {
      [option.id]: answer
    })
    if (Object.keys(answers).length === options.length) {
      callback(answers)
    } else {
      askForOption(options[nextIndex], nextIndex + 1, options, answers, callback)
    }
  })
}

const handleMetadataCommand = async () => {
  const args = process.argv
  const workingDirectory = process.cwd()
  return new Promise((resolveFn, rejectFn) => {
    const options = [
      { id: 'host',     text: 'Host     : ' },
      { id: 'port',     text: 'Port     : ' },
      { id: 'database', text: 'Database : ' },
      { id: 'user',     text: 'User     : ' },
      { id: 'password', text: 'Password : ' }
    ]
    askForOption(options[0], 1, options, {}, (answers) => {
      nordic.initialize(answers)
      nordic.getDatabaseMetadata().then((dbMetadata) => {
        fs.writeFileSync(
          path.resolve(workingDirectory, 'nordic-metadata.json'),
          JSON.stringify(dbMetadata, null, 2)
        )
        nordic.shutdown().then(() => {
          console.log('nordic: metadata generated successfully.')
          resolveFn()
        }).catch(rejectFn)
      }).catch(rejectFn)
    })
  })
}

const handleCommand = async () => {
  const args = process.argv
  if (args.length < 3) {
    throw new Error('No command given')
  }
  const command = args[2]
  switch (command) {
    case 'md':
      await handleMetadataCommand()
      break;
    default:
      throw new Error(`Unknown command ${command}`)
  }
}

handleCommand().then(() => {
  process.exit()
}).catch((error) => {
  console.log(`nordic: [error] ${error}`)
  nordic.shutdown().catch((ne) => {})
  process.exit(1)
})
