#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const nordic = require('../src/nordic')

const handleMetadataCommand = async () => {
  const args = process.argv
  const workingDirectory = process.cwd()
  //nordic.initialize({
  //})
  const dbMetadata = await nordic.getDatabaseMetadata()
  fs.writeFileSync(
    path.resolve(workingDirectory, 'nordic-metadata.json'),
    JSON.stringify(dbMetadata, null, 2)
  )
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

handleCommand().catch((error) => {
  console.log(`nordic: [error] ${error}`)
  process.exit(1)
})
