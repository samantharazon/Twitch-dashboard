
// This is where all the logic for your Twitch API will live!
const HOST_NAME = 'https://api.twitch.tv/helix'

// ===================================================
// Process Data
// ===================================================
// we need to process data
// gives us 2 things: request "req" and response "res"
// a circle: get something, know what to do with it, and send it back
export default async (req, res) => {
  try {
    // first we check request method
    // remember a method can be get or post depending on what action you want it to do
    if (req.method === 'POST') {
      // logic to handle that
      // inside our body we have some data
      // remember code from index :body: "JSON.stringify({ data: value })"
      const { data } = req.body
      // done with request
      // now speaking with response
      // status tells client if it was successful or failed
      // many status codes exist!!
      // ".json" takes data we have and convert into json object
      // Summary: we should be able to input a streamer name in input box, store it in a react state, call our twitch api, recieve value back from twitch api

      // ---------------------------------------
      // Search Twitch API
      // ---------------------------------------
      if (data) {
        // NOTE: RUNS getTwitchChannel 
        const channelData = await getTwitchChannel(data)

        if (channelData) {
          console.log("CHANNEL DATA: ", channelData)
          res.status(200).json({ data: channelData })
        }
        res.status(404)
      }
    }
  } catch (error) {
    console.warn(error.message)
    res.status(500).send()
  }

  /*
  If all goes well, you should then return your access token to the caller method, getTwitchChannel. 
  
  Try logging this access token to your console to make sure there is something there. Remember, this is secret so don't share it with anyone!

  SUMMARY: 
  You have setup the logic for getting an access token from Twitch and the logic for searching for the streamer based on what you entered into your input. There are two more things left to do:

  1. Call your getTwitchChannel in your API

  2. Filter out the streamer data that you need
  */
}

// ===================================================
// getTwitchAccessToken
// ===================================================
/*
authentication method is for Server-to-Server communication.

we will be using the OAuth client credentials flow.

 app access tokens are only for server-to-server API requests. The grant request below requires the client secret to acquire an app access token; this also should be done only as a server-to-server request, never in client code. 

This is technically the FIRST request you will be making to Twitch API
*/

// Actions
const getTwitchAccessToken = async () => {
  console.log('GETTING ACCESS TOKEN')

  // 1) On your server, get an app access token by making this request:
  /*
  Notice the request path looks different. This is because every API has an unique address. If you were trying to order a package and everyone had the same address, how would the delivery person know where to bring it? Same concept applies here!

  This is also where our TWITCH_CLIENT_ID & TWITCH_CLIENT_SECRET come into play! You are going to send these IDs over to Twitch so they can verify you as a valid Twitch Developer. Using access tokens, you're saying, "Hey Twitch - you gave me access to this, so can I have the data please?"
  
  */
  const path = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_SECRET_ID}&grant_type=client_credentials`

  // 2) We respond with a JSON-encoded app access token. The response looks like this:
  const response = await fetch(path, {
    method: 'POST'
  })

  if (response) {
    const json = await response.json()
    return json.access_token
  }

}

// ===================================================
// getTwitchChannel
// ===================================================

// Actions
const getTwitchChannel = async channelName => {
  console.log('HERE WE ARE')
  if (channelName) {
    // Get Access accessToken
    // NOTE: RUNS getTwitchAccessToken() 
    /*
    There are two big things happening here:
    1. You are calling a method to get some sort of access token 
    */
    const accessToken = await getTwitchAccessToken()

    /* 2. You are making the request to Twitch API given you have some access token */
    if (accessToken) {
       // ---------------------------------------
       // Make Query Request
       // ---------------------------------------
       /*
       Get information about one or more specified Twitch users. Users are identified by optional user IDs and/or login name. If neither a user ID nor a login name is specified, the user is looked up by Bearer token.

       once you get accessToken, call Twitch API to get the channel data for the person we typed into the input box
       */
      const response = await fetch(`${HOST_NAME}/search/channels?query=${channelName}`, {
        /*
        you need to pass in some headers for the request config. 
        These two pieces of data are required by Twitch to authenticate you and give you the "green light" to get this data. If you don't pass these header values, Twitch will immediately reject your request because they don't know who this request is coming from.
        */
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID
        }
      })

      const json = await response.json()

      if (json.data) {
        const { data } = json

        const lowerChannelName = channelName.toLowerCase()

        const foundChannel = data.find(channel => {
          const lowerTwitchChannelName = channel.display_name.toLowerCase()

          return lowerChannelName === lowerTwitchChannelName
        })

        return foundChannel
      }
    }
    /* if access token comes back as undefined, this error will show */
    throw new Error("Twitch accessToken was undefined.")
  }
  /* if channel name is a bad value, this error will show */
  throw new Error("No channelName provided.")
}