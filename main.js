class LMChat {


  // The total number of responses that have been received for the current query so far.
  #responseCount = 0;

  // The maximum number of responses to allow before aborting the query.
  #maxResponses = Number.MAX_VALUE;

  // Set to true to abort the current query.
  #stopRequest = false;

  // This object stores references to various DOM nodes that we'll need to access in the code, for performance.
  #domNodes = {
    conversationArea: null, /* The conversation area where our conversation goes. */
    queryTextArea: null, /* The query TextArea. */
    emptyQueryAlert: null, /* The "empty query" alert. */
    emptyServerAddressAlert: null, /* The "empty server address" alert. */
    submitAbortQueryButton: null, /* The Query/Abort button. */
    submitAbortQueryIcon: null, /* The Query/Abort button's icon. */
    currentConversationResponse: null, /* The current server response being written. */
    drawer: null, /* The settings Drawer. */
    serverAddressInput: null, /* The server address Input. */
    customInstructionsTextArea: null, /* The custom instructions TextArea. */
    darkModeSwitch: null /* The dark mode Switch. */
  };


  /**
   * Initialize the application.
   */
  init() {

    console.log(`init()`);

    // Cache references to DOM elements to avoid continual lookups.
    this.#domNodes.conversationArea = document.getElementById(`conversationArea`);
    this.#domNodes.emptyQueryAlert = document.getElementById(`emptyQueryAlert`);
    this.#domNodes.emptyServerAddressAlert = document.getElementById(`emptyServerAddressAlert`);
    this.#domNodes.queryTextArea = document.getElementById(`queryTextArea`);
    this.#domNodes.submitAbortQueryButton = document.getElementById(`submitAbortQueryButton`);
    this.#domNodes.submitAbortQueryIcon = document.getElementById(`submitAbortQueryIcon`);
    this.#domNodes.drawer = document.getElementById(`drawer`);
    this.#domNodes.customInstructionsTextArea = document.getElementById(`customInstructionsTextArea`);
    this.#domNodes.serverAddressInput = document.getElementById(`serverAddressInput`);
    this.#domNodes.darkModeSwitch = document.getElementById(`darkModeSwitch`);

    // If we have saved settings, use the values.
    const lsServerAddress = localStorage.getItem(`serverAddress`);
    const lsCustomInstructions = localStorage.getItem(`customInstructions`);
    const lsDarkMode = localStorage.getItem(`darkMode`);
    console.log(
      `lsServerAddress=${lsServerAddress}, lsCustomInstructions=${lsCustomInstructions}, lsDarkMode=${lsDarkMode}`
    );
    if (lsServerAddress) {
      this.#domNodes.serverAddressInput.value = lsServerAddress;
    }
    if (lsCustomInstructions) {
      this.#domNodes.customInstructionsTextArea.value = lsCustomInstructions;
    }
    if (lsDarkMode) {
      this.#domNodes.darkModeSwitch.checked = lsDarkMode;
      this.#changeTheme();
    }

    // Attach listener to Drawer hide event to save the settings.
    this.#domNodes.drawer.addEventListener(`sl-hide`, this.#saveSettings.bind(this));

    // Attach listener to dark mode Switch change event to save the settings.
    this.#domNodes.drawer.addEventListener(`sl-change`, this.#changeTheme.bind(this));

  } /* End init(). */


  /**
   * This function can be used to abort a request if we go beyond a defined response limit.
   *
   * @return True if beyond limit, false of not.
   */
  #isBeyondResponseLimit() {

    this.#responseCount++;
    return this.#responseCount > this.#maxResponses || this.#stopRequest;

  } /* End isBeyondResponseLimit(). */


  /**
   * Submits a query to the server and processes the response from it.
   */
  async submitOrAbortQuery() {

    console.log(`submitOrAbortQuery()`);

    // Get reference to Submit/Abort button and if it's of the danger variety then abort the current request, resetting
    // the button too.  Otherwise, we'll start a new request.
    if (this.#domNodes.submitAbortQueryButton.variant === `danger`) {
      this.#abortQuery();
      return;
    }

    // Make sure we have a server address.
    const serverAddress = this.#domNodes.serverAddressInput.value;
    if (!serverAddress) {
      //noinspection JSUnresolvedReference
      emptyServerAddressAlert.toast();
      return;
    }

    // Get the query the user entered, and abort if none.  If there is one, clear the text area and add the query to
    // the conversation area.
    const query = this.#domNodes.queryTextArea.value;
    if (!query) {
      //noinspection JSUnresolvedReference
      emptyQueryAlert.toast();
      return;
    }
    this.#domNodes.queryTextArea.value = ``;
    this.#addContentToConversationArea(`
      <div class="conversationUserContainer">
        <sl-icon name="person-circle" class="conversationUserIcon"></sl-icon>
        <div class="conversationUserInnerDiv">
          <div class="conversationUserHeader" style="display:inline-block;">You</div>
          <div class="conversationUserQuery" style="display:inline-block;">${query}</div>
        </div>
      </div>
    `, false);

    // Now add an area where the response will go.
    const currentConversationResponseID = `conversationResponse_${this.#responseCount}`;
    this.#addContentToConversationArea(
      `<div id="${currentConversationResponseID}" class="conversationServerResponse"></div>`, false
    );
    this.#domNodes.currentConversationResponse = document.getElementById(currentConversationResponseID);

    // Button should now be of the Abort variety.
    this.#domNodes.submitAbortQueryButton.variant = `danger`;
    this.#domNodes.submitAbortQueryIcon.name = `x-square`;
    this.#domNodes.submitAbortQueryIcon.label = `Abort Query`;

    this.#responseCount = 0;
    this.#stopRequest = false;

    try {

      // Construct messages array, which may or may not include a system role for custom instructions.
      const messages = [ ];
      messages.push({ role: `user`, content: query });
      const customInstructions = this.#domNodes.customInstructionsTextArea.value;
      if (customInstructions !== `` && customInstructions.trim() !== ``) {
        messages.push({ role: `system`, content: customInstructions });
      }

      const response = await fetch(`${serverAddress}/v1/chat/completions`, {
        method: `POST`,
        headers: { 'Content-Type': `application/json` },
        body: JSON.stringify({
          messages: messages,
          temperature: 0.7,
          max_tokens: -1,
          stream: true
        })
      });

      // Get the readable stream from the response body.
      const reader = response.body.getReader();
      const decoder = new TextDecoder(`utf-8`);

      // Buffer for accumulating text data.
      let buffer = ``;

      // Value and flag for when we're done reading from the stream.
      let value = null;
      let done = null;

      while (!done && !this.#stopRequest) {

        // Read from the stream.
        ({ done, value } = await reader.read());
        if (done) {
          console.log(`Response done`);
        }

        // Get string from bugger.
        buffer += decoder.decode(value, { stream: true });

        // Find the first opening and the last closing brace.
        let startOfJson = buffer.indexOf(`{`);
        let endOfJson = buffer.lastIndexOf(`}`);

        // Check if there's a complete JSON object in the buffer.
        if (startOfJson !== -1 && endOfJson > startOfJson) {

          // Extract the JSON string from the buffer.
          const potentialJson = buffer.substring(startOfJson, endOfJson + 1);

          try {

            // Parse the JSON string.
            const json = JSON.parse(potentialJson);

            //noinspection JSUnresolvedReference
            if (json.choices) {
              json.choices.forEach(choice => {
                //noinspection JSUnresolvedReference
                if (choice.delta?.content) {
                  // Append each piece of content to the current server response in the conversation area.
                  //noinspection JSUnresolvedReference
                  this.#addContentToConversationArea(`${choice.delta.content}`, true);
                }
              });
            }

            // Clear the buffer up to the end of the processed JSON object.
            buffer = buffer.substring(endOfJson + 1);

          } catch (inError) {
            console.error(`Error parsing JSON`, inError);
            // If parsing fails, reset the buffer to start from the beginning of the detected JSON.
            buffer = buffer.substring(startOfJson);
          }

        }

        this.#stopRequest = this.#isBeyondResponseLimit();

      } /* End while. */

      this.#resetQueryAbortButton();

    } catch (inError) {
      console.error(`Stream fetch error`, inError);
    }

  } /* End submitOrAbortQuery(). */


  /**
   * Adds content to the conversation area and scrolls to the bottom to "follow" the conversation.
   *
   * @param inContent    The content to add to the conversation area.
   * @param inIsResponse True if we're adding part of the server's response, false if adding the user's query or the
   *                     initial server response container element.
   */
  #addContentToConversationArea(inContent, inIsResponse) {

    if (inIsResponse) {
      this.#domNodes.currentConversationResponse.innerHTML += inContent
    } else {
      this.#domNodes.conversationArea.innerHTML += inContent;
    }
    this.#domNodes.conversationArea.scrollTop = this.#domNodes.conversationArea.scrollHeight;

  } /* End addContentToConversationArea(). */


  /**
   * Aborts the current call to the server.
   */
  #abortQuery() {

    console.log(`abortQuery()`);

    // Stop the request itself.
    this.#stopRequest = true;

    this.#resetQueryAbortButton()

  } /* End abortQuery(). */


  /**
   * Resets the Query/Abort button to its initial state.
   */
  #resetQueryAbortButton() {

    console.log(`resetQueryAbortButton()`);

    this.#domNodes.submitAbortQueryButton.variant = `primary`;
    this.#domNodes.submitAbortQueryIcon.name = `box-arrow-up`;
    this.#domNodes.submitAbortQueryIcon.label = `Submit Query`;

  } /* End resetQueryAbortButton(). */


  /**
   * Called when the drawer trigger button is clicked to open the drawer.
   */
  openDrawer() {

    console.log(`openDrawer()`);

    this.#domNodes.drawer.show();

  } /* End openDrawer(). */


  /**
   * Saves the settings in the Drawer into LocalStorage.
   */
  #saveSettings() {

    console.log(`saveSettings()`);

    localStorage.setItem(`serverAddress`, this.#domNodes.serverAddressInput.value);
    localStorage.setItem(`customInstructions`, this.#domNodes.customInstructionsTextArea.value);
    const useDarkMode = this.#domNodes.darkModeSwitch.checked;
    if (useDarkMode) {
      localStorage.setItem(`darkMode`, `yes`);
    } else{
      localStorage.removeItem(`darkMode`);
    }

  } /* End saveSettings(). */


  /**
   * Changes the app's theme based on whether the Dark Mode Switch is true or false.
   */
  #changeTheme() {

    console.log(`changeTheme()`);

    document.documentElement.className = this.#domNodes.darkModeSwitch.checked ? `sl-theme-dark` : `sl-theme-light`;

  } /* End changeTheme(). */


} /* End LMChat class. */


const lmChat = new LMChat();
