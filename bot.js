const { Client, GatewayIntentBits, WebhookClient, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const Config = require("./Config.json");

let WHClients = {}

function getWebHook(id, token) {
    return new Promise((resolve) => {
        client.fetchWebhook(id, token)
            .then(webhook => {
                resolve({
                    guildId: webhook.guildId,
                    channelId: webhook.channelId
                });
            })
            .catch(console.error);
    });
}

client.on(Events.ClientReady, async () => {
    console.log(`login: (${client.user.tag})`);
    // ボット起動時にウェブフックを記録

    await Promise.all(Config.WebHooks.map(async webhook => {
        const WHClient = new WebhookClient({ url: webhook });
        const data = await getWebHook(WHClient.id, WHClient.token);

        //ギルドIDが登録されてなかったら登録する
        if (WHClients[data.guildId] == undefined)
            WHClients[data.guildId] = {};

        //チャンネルIDが登録されてなかったら登録する
        if (WHClients[data.guildId][data.channelId] == undefined)
            WHClients[data.guildId][data.channelId] = [];

        //WebhookClient追加
        WHClients[data.guildId][data.channelId].push(WHClient)

    }))
    console.log(WHClients);
});


client.on(Events.MessageCreate, async message => {
    const author = message.author;
    if (!author.bot) {

        //送信したメッセージが[今って言え]だった場合 return
        if (message.content == "今って言え") return;

        const content = message.content.replace("今", "過去と未来の狭間");

        //変更点がなかった場合 return
        if (content == message.content) return;


        //ウェブフックがあるかチェック
        if (WHClients[message.guildId] == undefined) return;
        if (WHClients[message.guildId][message.channelId] == undefined) return;
        console.log(content)


        //元のメッセージ削除
        message.delete()

        WHClients[message.guildId][message.channelId].forEach(item => {
            //WebHookで送信
            const send = {
                content: content,
                username: author.username,
                avatarURL: message.author.avatarURL(),
                tts: message.tts,
                embeds: message.embeds,
                components: message.components
            };
            item.send(send);
        });
    }
});

client.login(Config.token);