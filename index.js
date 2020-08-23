const fs = require('fs').promises;
const meme_type = require('meme-type-npm');
const OAuth = require('oauth');

const RETRIES = 10;

function generateContent(file) {
    const start = Math.floor(Math.random() * file.length);
    const excerpt = file.slice(start, start + 10).join('\n');

    const emojiSentences = meme_type.emojify(excerpt).split('.');

    let ret = emojiSentences.filter(x => x.trim().length > 20 && x.trim().length <= 280)[0].trim();

    // remove last word if all caps
    if (ret) {
        const s = ret.split(' ');
        if (s[s.length - 1].toUpperCase() === s[s.length - 1]) {
            return s.splice(0, s.length - 1).join(' ');
        }
    }

    return ret;
}

async function processText() {

    const data = await fs.readFile('./complete_works.txt', 'utf8', function(err) { if (err) throw err; });

    const lines = data.split('\n\n');

    for(let i = 0; i < RETRIES; i++) {
        let ret;
        try {
            ret = generateContent(lines);
        } catch (e) { }

        if (ret) {
            return ret;
        }
    }
}

async function tweet (message) {
    var twitter_application_consumer_key = process.env.API;  // API Key
    var twitter_application_secret = process.env.API_SECRET;  // API Secret
    var twitter_user_access_token = process.env.ACCESS_TOKEN;  // Access Token
    var twitter_user_secret = process.env.ACCESS_TOKEN_SECRET;  // Access Token Secret

    var oauth = new OAuth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        twitter_application_consumer_key,
        twitter_application_secret,
        '1.0A',
        null,
        'HMAC-SHA1'
    );

    var postBody = {
        'status': message
    };

    return new Promise( (resolve, reject) => {
        oauth.post('https://api.twitter.com/1.1/statuses/update.json',
            twitter_user_access_token,  // oauth_token (user access token)
            twitter_user_secret,  // oauth_secret (user secret)
            postBody,  // post body
            '',  // post content type ?
            function(err, data, res) {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                if (data) {
                    resolve(data);
                }
        });
    });
}

exports.handler = async (event) => { 
    try {
        console.log('generating content');
        const content = await processText();
        console.log(content);
        await tweet(content);
        
        return { statusCode: 204 };
    } catch (e) {
        console.error(e);
        return { statusCode: 500 };
    }
}
