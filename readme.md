# LMChat

LMChat is a simple ChatGPT clone that uses [LM Studio](https://lmstudio.ai) as a back-end LLM provider.  It uses the 
[Shoelace](https://shoelace.style) library for its UI.

## Rationale

Why build such a thing in the first place?  Well, there were three primary reasons:

* I wanted to have my own version of ChatGPT - even if only a very rudimentary version - that was private and running
  on my own home server.  I don't like to be dependent on any service providers any more than I have to be, and in this
  case, I didn't really have to be.
* I wanted a project that would give me a chance to play with web components a bit, and Shoelace in particular, and this
  one had enough to make it interesting but not enough to make it difficult. 
* I had just finished writing a new book (selfless plug: [Web Development Career Master Plan](https://www.amazon.com/Web-Development-Career-Master-Plan/dp/1803247088?dplnkId=6ad82ec9-0ed6-420d-825d-db84829cdbaf) - Learn what it means to be a web developer and launch your journey toward a career in the industry - Packt Publishing), and I needed something of a "palate cleanser" project, so to speak!

I in no way, shape or form think this is any sort of great project.  But, it scratched the itch... and hey, if nothing
else, it works, which is always nice, right?

## How To Use

The first part of using this is simply to install and run LM Studio.  When you do so, you'll find that it offers a
Local Server option.  All you need to do it start it, and select a model (assuming you've downloaded one already).

The only option you need to touch is the Cross-Origin Resource Sharing (CORS) option, which must be switched ON.  It
should be noted that doing this decreases the security of the server to some extent, so it is not recommended that you
run in this configuration on a machine exposed to the Internet.  If you want to do that, you should understand the
consequences!  Alternatively, you can leave it switched off and then make appropriate changes to the code (you'll have
to muck about with CORS headers, and I leave that as an exercise to you).  You'll also need to run the client on a web
server to make it work in that case.

But, with CORS on, all you need to do is load the **index.html** file in the browser of your choice.  Everything should
work fine whether it's on a web server or just loaded off the file system locally. 

When you launch it, click the gear to open the settings drawer,  In there, you must provide the full URL to your server.
By default, the LM Studio server should start on port 1234, so a URL in the form **http://<server_url>:1234** should do
the trick.  Settings save when the drawer is closed.

The Custom Instructions are optional, but allows you to tell the model how to respond and act, just like Custom
Instructions in ChatGPT does.

There is a dark mode toggle if you prefer that, but LMChat defaults to a light mode because I still prefer that.

Note that settings are saved in browser Local Storage, so they won't follow you from machine to machine.

And that, really, is about it!  Enter your query at the bottom, click the button, and watch LM Studio respond!  You can
cancel a query in progress by clicking the button again, and you cannot send a new query until the in-progress query
either completes or is aborted.

Like I said, it's a **very** simple clone, very basic, but it gets the job done.  If you've got a reasonably powerful
server you can even get pretty good performance out of it (and, of course, you can run LM Studio on the same machine
if you like, though there's probably not too much point in doing that since the LM Studio UI is superior to LMChat,
so you might as well use it if you're running it locally anyway).

## Known Issues

* There is currently no formatting in the response, it's just dumped into a div as-is.  Formatting when in steaming mode is a little tricky, but I have a plan, and I intend to get to it before too long. 

Thanks and have fun, kids!
Frank
