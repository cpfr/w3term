window.w3term = function(node, options){
    function Terminal(node, options) {
        // ---------------------------------------------------------------------
        var _commandHistory = [];
        var _commandStep = 0;
        var _options = {
            prompt : "> ",
            historySize : 100,
            processCommand : function(string, args) {
                console.log(string, args);
            }
        };
        var _terminal = this; // because this scoping is broken in JS
        var _inputEnabled = true;
        var _skipPattern = /([A-Za-z][^A-Za-z]|[0-9][^0-9])/g;
        // ---------------------------------------------------------------------

        var _node = node;
        var _hiddenInput;
        var _currentLine;
        var _prompt;
        var _prev;
        var _caret;
        var _next;
        // ---------------------------------------------------------------------
        setOptions(_options, options);

        _node.className += " w3term";
        _hiddenInput = document.createElement("input");
        _hiddenInput.type = "text";
        _hiddenInput.className = "hiddenInput";

        _currentLine = document.createElement("span");
        _currentLine.className = "currentLine";
        _currentLine.tabindex = 0;

        _prompt = document.createElement("span");
        _prompt.className = "prompt";
        _prompt.textContent = _options.prompt;

        _prev = document.createElement("span");
        _next = document.createElement("span");
        _caret = document.createElement("span");
        _caret.textContent = " ";
        _caret.className = "textcursor term-blink";

        _currentLine.appendChild(_prompt);
        _currentLine.appendChild(_prev);
        _currentLine.appendChild(_caret);
        _currentLine.appendChild(_next);
        _node.appendChild(_currentLine);
        _node.appendChild(_hiddenInput);

        // --- define public methods -------------------------------------------

        _terminal.backspace = function() {
            _prev.textContent = _prev.textContent.slice(0,-1);
        };

        _terminal.skipBackspace = function() {
            var matches = [];
            while((match = _skipPattern.exec(
                _prev.textContent.slice(0, -1))) != null)
            {
                matches.push(match.index);
            }
            if(matches.length > 0) {
                // if there was a word separation, jump there
                var newIndex = matches[matches.length-1]+2;
                _prev.textContent = _prev.textContent.slice(0, newIndex);
            }
            else {
                _prev.textContent = "";
            }
        };

        _terminal.delete = function() {
            _caret.textContent = _next.textContent.slice(0,1);
            _next.textContent = _next.textContent.slice(1);
        };

        _terminal.navigate = function(pos) {
            if(pos == _prev.textContent.length) return;
            var wholeText = _prev.textContent
                          + _caret.textContent
                          + _next.textContent;

            if(pos <= 0) {
                pos = 0;
                _prev.textContent = "";
                if(wholeText.length == 0)
                    _caret.textContent = " ";
                else
                    _caret.textContent = wholeText.charAt(0);
                _next.textContent = wholeText.substring(1);
            }
            else if(pos >= wholeText.length) {
                _prev.textContent = wholeText.substring(0, wholeText.length-1);
                _caret.textContent = wholeText.charAt(wholeText.length-1);
                _next.textContent = "";
            }
            else {
                _prev.textContent = wholeText.substring(0, pos);
                _caret.textContent = wholeText.charAt(pos);
                _next.textContent = wholeText.substring(pos+1);
            }

            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
        };

        _terminal.moveLeft = function() {
            _terminal.navigate(_prev.textContent.length-1);
        };

        _terminal.skipLeft = function() {
            var textBefore = _prev.textContent;

            if(textBefore == "") return;

            var matches = [];
            while((match = _skipPattern.exec(textBefore.slice(0, -1))) != null) {
                matches.push(match.index);
            }
            // if there was a word separation, jump there
            if(matches.length > 0) {
                var newIndex = matches[matches.length-1]+2;
                _terminal.navigate(newIndex);
            } else {
                // if there was no word separation, perform as if
                // the home button was pressed
                _terminal.home();
            }
        };

        _terminal.moveRight = function() {
            _terminal.navigate(_prev.textContent.length+1);
        };

        _terminal.skipRight = function() {
            var textAfter = _next.textContent;

            match = _skipPattern.exec(textAfter);
            if(match) {
                // if there was a word separation, jump there
                var newIndex = match.index+2;
                _terminal.navigate(newIndex);
            } else {
                // if there was no word separation, perform as if
                // the home button was pressed
                _terminal.end();
            }
        };

        _terminal.home = function() {
            _terminal.navigate(0);
        };

        _terminal.end = function() {
            _terminal.navigate(_prev.textContent.length
                + _caret.textContent.length
                + _next.textContent.length
                -1);
        };

        _terminal.enter = function() {
            var wholeText = (_prev.textContent
                        + _caret.textContent
                        + _next.textContent).trim();

            var newLine = document.createElement("p");
            var prompt = document.createElement("span");
            prompt.className = "prompt";
            prompt.textContent = _options.prompt;
            newLine.appendChild(prompt);
            newLine.appendChild(document.createTextNode(wholeText));
            _node.insertBefore(newLine, _currentLine);

            // new empty line
            _prev.textContent = "";
            _next.textContent = "";
            _caret.textContent = " ";

            if(wholeText != "") {
                var commandCount = _commandHistory.length;

                if(wholeText != _commandHistory[commandCount-1])
                {
                    // limit the size of the command history
                    if(commandCount >= _options.historySize) {
                        _commandHistory.shift();
                    }
                    _commandHistory.push(wholeText);
                }
                _commandStep = _commandHistory.length;

                // process command
                _options.processCommand(wholeText, parseBashArgs(wholeText));
            }
            _prompt.textContent = _options.prompt;
            _terminal.scrollToBottom();
        };

        _terminal.setInput = function(text) {
            text = text.replace(/(?:\r\n|\r|\n)/g, " ");
            _prev.textContent = text;
            _caret.textContent = " ";
            _next.textContent = "";
        };

        _terminal.clear = function() {
            var paragraph;
            while(paragraph = _node.getElementsByTagName("P")[0]) {
                _node.removeChild(paragraph);
            }
        };

        // print text to the terminal
        _terminal.print = function(text, escapeHtml) {
            if(escapeHtml === undefined){
                escapeHtml = true;
            }
            text = text || "";
            if(escapeHtml) {
                text = text.replace(/&/g, "&amp;");
                text = text.replace(/</g, "&lt;");
                text = text.replace(/>/g, "&gt;");
            }
            var textNode = processColors(text);

            var outputElement = _currentLine.previousSibling;
            if(outputElement.classList.contains("output")) {
                outputElement.appendChild(textNode);
            }
            else {
                var outParagraph = document.createElement("p");
                outParagraph.className = "output";
                outParagraph.appendChild(textNode);
                _node.insertBefore(outParagraph, _currentLine);
            }
            _terminal.scrollToBottom();
        };

        // print text to the terminal (with line ending)
        _terminal.println = function(text, escapeHtml) {
            _terminal.print(text+"\n", escapeHtml);
        };

        // scrolls down to the last line of the terminal
        _terminal.scrollToBottom = function() {
            _node.scrollTop = _node.scrollHeight;
        };

        // hides the caret and disables user input
        _terminal.disableInput = function(){
            _currentLine.style.display = "none";
            _inputEnabled = false;
            _hiddenInput.blur();
        },

        // hides the caret and disables user input
        _terminal.enableInput = function(){
            _currentLine.style.display = "inline";
            _inputEnabled = true;
            _hiddenInput.focus();
        },

        _terminal.setOptions = function (options) {
            setOptions(_options, options);
        }

        // --- define handlers -------------------------------------------------
        // set focus to currentLine when terminal is clicked -------------------
        _node.onclick = function(evt) {
            _hiddenInput.focus();
        };

        _node.focus = function() {
            _hiddenInput.focus();
        };

        // Insert Charcters when a key is pressed ------------------------------
        _node.oninput = function(evt) {
            _prev.textContent += _hiddenInput.value;
            _hiddenInput.value = "";
        };

        // Catch special keys before a character is inserted -------------------
        _node.onkeydown = function(evt) {
            if(!_inputEnabled) return;
            var char = evt.keyCode;

            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;

            switch(char) {
                case 27: // ESCAPE
                    evt.preventDefault();
                    break;
                case 8: // BACKSPACE
                    evt.preventDefault();
                    if(evt.altKey)
                        _terminal.skipBackspace();
                    else {
                        _terminal.backspace();
                    }
                    break;
                case 46: // DEL
                    evt.preventDefault();
                    _terminal.delete();
                    break;
                case 9: // TAB
                    // TODO: implement tab completion
                    break;
                case 37: // LEFT
                    evt.preventDefault();
                    // if the ctrl key is pressed, we move until the next
                    // non-character symbol
                    if(evt.ctrlKey) _terminal.skipLeft();
                    else _terminal.moveLeft();
                    break;
                case 39: // RIGHT
                    evt.preventDefault();
                    // if the ctrl key is pressed, we move until the next
                    // non-character symbol
                    if(evt.ctrlKey) _terminal.skipRight();
                    else _terminal.moveRight();
                    break;
                case 38: // UP
                    evt.preventDefault();
                    var step = _commandStep;
                    if(step > 0) {
                        step--;
                        _terminal.setInput(_commandHistory[step]);
                        _commandStep = step;
                    }
                    break;
                case 40: // DOWN
                    evt.preventDefault();
                    var step = _commandStep;
                    if(step < _commandHistory.length) {
                        step++;
                        if(step == _commandHistory.length) {
                            _terminal.setInput("");
                        } else {
                            _terminal.setInput(_commandHistory[step]);
                        }
                        _commandStep = step;
                    }
                    break;
                case 35: // END
                    evt.preventDefault();
                    _terminal.end();
                    break;
                case 36: // HOME
                    evt.preventDefault();
                    _terminal.home();
                    break;
                case 13: // ENTER
                    evt.preventDefault();
                    _terminal.enter();
                    break;
                default:
                    break;
            }
        };
        // ---------------------------------------------------------------------
        _node.focus();
    }

    // -------------------------------------------------------------------------

    function getNodeArg(node) {
        if(!node.tagName) {
            throw "invalid node, w3term needs a DOM node as an argument";
        }
        else if(node.tagName == "DIV") {
            clearNode(node);
        }
        else {
            newNode = document.createElement("div");
            node.parentNode.replaceChild(newNode, node);
            node = newNode;
        }
        return node;
    }

    // clears all children and text content from a node
    function clearNode(node){
        while(node.firstChild){
            node.removeChild(node.firstChild);
        }
    }

    function processColors(text){
        var rootTag = document.createElement("span");
        var currentTag = rootTag;

        var i = text.indexOf("\x1B[");
        while(i >= 0) {
            currentTag.appendChild(document.createTextNode(text.substr(0, i)));

            // add a new command or reset font?
            if(text.substr(i, 4) == "\x1B[0m"){ // reset
                currentTag = rootTag;
                colorCode = "\x1B[0m";
            }
            else {
                colorCode = text.substr(i, 5);
                if(colorCode.charAt(3) == 'm') {
                    colorCode = colorCode.substr(0, 4);
                }
                var newTag = getColorTag(colorCode);
                currentTag.appendChild(newTag);
                currentTag = newTag;
            }
            // replace the code by the new tag
            text = text.substr(i + colorCode.length);
            i = text.indexOf("\x1B[");
        }
        currentTag.appendChild(document.createTextNode(text));
        return rootTag;
    }

    function getColorTag(colorCode) {
        var tag = document.createElement("span");
        switch(colorCode){
            case "\x1B[31m":
                tag.style.color = "red";
                break;
            case "\x1B[32m":
                tag.style.color = "green";
                break;
            case "\x1B[33m":
                tag.style.color = "yellow";
                break;
            case "\x1B[34m":
                tag.style.color = "blue";
                break;
            case "\x1B[35m":
                tag.style.color = "magenta";
                break;
            case "\x1B[36m":
                tag.style.color = "cyan";
                break;
            case "\x1B[37m":
                tag.style.color = "white";
                break;
            case "\x1B[41m":
                tag.style.backgroundColor = "red";
                break;
            case "\x1B[42m":
                tag.style.backgroundColor = "green";
                break;
            case "\x1B[43m":
                tag.style.backgroundColor = "yellow";
                break;
            case "\x1B[44m":
                tag.style.backgroundColor = "blue";
                break;
            case "\x1B[45m":
                tag.style.backgroundColor = "magenta";
                break;
            case "\x1B[46m":
                tag.style.backgroundColor = "cyan";
                break;
            case "\x1B[47m":
                tag.style.backgroundColor = "white";
                break;
            case "\x1B[1m":
                tag.style.fontWeight = "bold";
                break;
            case "\x1B[3m":
                tag.style.fontStyle = "italic";
                break;
            case "\x1B[4m":
                tag.style.textDecoration = "underline";
                break;
            case "\x1B[5m":
                tag.className = "term-textblink";
                break;
            case "\x1B[7m":
                tag.className = "term-textinverted";
                break;
            case "\x1B[92m": // success
                tag.style.color = "#00EE00";
                break;
            case "\x1B[95m": // header
                tag.style.color = "#660099";
                break;
            case "\x1B[94m": // info
                tag.style.color = "#3399FF";
                break;
            case "\x1B[93m": // warning
                tag.style.color = "#FF9900";
                break;
            case "\x1B[91m": // error
                tag.style.color = "#990000";
                break;
            default:
                break;
        }
        return tag;
    }

    function parseBashArg(char, cmdString, i) {
        var startIndex = i;
        var text = "";
        var escaped = false;
        for(; i < cmdString.length; i++) {
            if(!escaped && cmdString.charAt(i) == "\\") {
                escaped = true;
                continue;
            }
            if(cmdString.charAt(i) == char) {
                if(escaped) {
                    text += cmdString.slice(startIndex, i-1) + char;
                    startIndex = i+1;
                }
                else {
                    break;
                }
            }
            escaped = false;
        }
        return {
            arg : text + cmdString.slice(startIndex, i),
            i : i
        };
    }

    function parseBashArgs(cmdString) {
        var outputArgs = [];
        var escaped = false;
        var inString = false;
        for(var i = 0; i < cmdString.length; i++) {
            if(cmdString.charAt(i) == "\"") {
                result = parseBashArg("\"", cmdString, i+1);
                outputArgs.push(result.arg);
                i = result.i+1; // skip not only the quote, but also whitespace
            }
            else {
                result = parseBashArg(" ", cmdString, i);
                outputArgs.push(result.arg);
                i = result.i;
            }
        }
        if(i < cmdString.length) {
            outputArgs.push(cmdString.slice(i, cmdString.length));
        }
        return outputArgs;
    }

    function setOptions(original, newValues) {
        if(newValues.prompt !== undefined)
            original.prompt = newValues.prompt;

        if(newValues.historySize !== undefined)
            original.historySize = newValues.historySize;

        if(newValues.processCommand !== undefined)
            original.processCommand = newValues.processCommand;
    }

    // -------------------------------------------------------------------------

    node = getNodeArg(node);
    node.w3term = new Terminal(node, options);
    return node;
}
