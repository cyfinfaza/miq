## Inspiration

After working audio for a couple years at my high school's auditorium, it became clear that we needed a better mic cue solution. For reference: when you're running a show with 16+ actors, it can get hard to manage who is supposed to be muted and unmuted in any given scene, as well as keep track of little mixing details you have to remember for each scene. Previously, we just used a Google Sheet which we clicked through to record and see this information during the show, as well as manually inputted all of the mic mutes into clunky, paid, Windows software in order to automate the mutes and unmutes for the different scenes. Miq reimagines this whole process with a simple, open-source, web-based solution. Simply paste in the ID of the same Google Sheet you used in the past, input a few row and column identifiers, and Miq becomes a powerful touchscreen interface for previewing mute cues, reading scene notes, and crucially, automating mutes as well as scribble strip (LCD screen labels for each fader) updates on your Behringer X32 or Midas M32 live mixing console.

## What it does and how it works

### Database

Miq starts with its database. Miq's browser-local database permits the user to download and update locally-stored Google Sheets for offline use (for example, when your audio console's LAN doesn't have internet access), as well as store multiple show configurations. The database runs on Dexie - an IndexedDB wrapper that allows for simple updates and subscriptions.

### Cue Interface

The cue interface allows the user to quickly preview their mute cues and read notes. The design of the interface is designed to be reminiscent to the Blackmagic AETM video switching system which is also used at our auditorium: green means preview, red means live. The interface displays 2 cues at once as a result - on the top in green is the cue you are previewing, which can be changed without affecting your actual sound console, and on the bottom in red is the cue that is live on the sound console, and can be changed by firing your preview cue with the "Fire" button.

### OSC Connection

In order to live update the mutes on your sound console as well as change the scribble strip labels and colors with those of the active actors, Miq connects to the sound console via OSC. OSC, however, cannot run in a browser, so Miq uses a program called `x32-proxy` which can be run on the host machine to proxy an OSC over TCP connection to the sound console to an OSC over WebSockets connection to Miq, when this functionality is needed.

### Interface

Miq's interface is written in Svelte using the Vite build tool, and uses `vite-plugin-pwa` to achieve offline and standalone support via a service worker.

## Challenges we ran into

The main challenge I ran into was that I thought we would have internet access on the audio console's LAN, but as it turns out we would not. As a result, it became necessary to implement an entire local database system in order to store Google Sheets files for offline use. This was where a lot of the time was spent at HackPHS.

## Accomplishments that we're proud of

Before attending HackPHS, my idea had already existed and I had already experimented with some of the OSC via WebSockets techniques when in school with the actual sound console. I had also already laid out a rough and rather buggy interface, but had not had time to really make something usable. After work at HackPHS, the idea has been thoroughly executed, and is ready for final testing before use for our next production, for which rehearsals start this coming week.

## What we learned

- Learned how to configure Google Workbox for use with Vite
- Learned how to use OSC with `x32-proxy` to control the sound board from a web browser

## What's next for miq

Trying it out for the first time at rehearsal tomorrow...
