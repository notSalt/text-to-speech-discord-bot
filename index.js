const { Client, Collection } = require('discord.js')
const { TextToSpeechClient } = require('@google-cloud/text-to-speech')
const { writeFile } = require('fs')
const { promisify } = require('util')
const { join } = require('path')
const config = require('./config.json')

process.env.GOOGLE_APPLICATION_CREDENTIALS = join(__dirname, 'api.json') 

const client = new Client()
const speech = new TextToSpeechClient()

const connections = new Collection()

client.once('ready', () => console.log(`${client.user.tag} is now ready!`))

client.on('message', async message => {
  if (message.content.startsWith('!join')) {
    if (!message.member.voice.channel) return message.reply('ur not in channel lol')
    if (!message.member.voice.channel.joinable) return message.reply('can\'t join bruh')
    const connection = await message.member.voice.channel.join()
    connections.set(message.guild.id, connection)
    message.react('😳')

    connection.once('ready', () => {
      connection.on('speaking', (user, speaking) => {
        
      })
    })
  }

  if (message.content.startsWith('!leave')) {
    if (!message.member.voice.channel) return message.reply('ur not in channel lol')
    message.member.voice.channel.leave()
    connections.delete(message.guild.id)
    message.react('😳')
  }

  if (message.content.startsWith('!say')) {
    const args = message.content.split(' ').splice(1)
    if (args.length < 1) return message.reply('say what?')
    const text = args.join(' ')
    const request = {
      input: { text: text },
      voice: { languageCode: 'en-US', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' }
    }
    const [response] = await speech.synthesizeSpeech(request)
    const betterWriteFile = promisify(writeFile)
    await betterWriteFile('output.mp3', response.audioContent, 'binary')
    const connection = connections.get(message.guild.id)
    connection.play('./output.mp3')
  }
})

client.login(config.token)