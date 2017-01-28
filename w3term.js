window.w3term = function(node, options){
    function Terminal(node, options) {
        // ---------------------------------------------------------------------
        var _commandHistory = [];
        var _commandStep = 0;
        var _options = options || {};
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
        setOptionDefaults(_options);

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

        _terminal.moveLeft = function() {
            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;
            var lastChar = textBefore.slice(-1);

            if(lastChar == '') return;
            if(_next.textContent == "" && _caret.textContent == " ")
                _caret.textContent = "";

            _next.textContent = _caret.textContent+textAfter;
            _caret.textContent = lastChar;
            _prev.textContent = textBefore.slice(0, -1);

            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
        };

        _terminal.skipLeft = function() {
            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;

            if(textBefore == "") return;

            var matches = [];
            while((match = _skipPattern.exec(textBefore.slice(0, -1))) != null) {
                matches.push(match.index);
            }
            if(matches.length > 0) {
                // if there was a word separation, jump there
                var newIndex = matches[matches.length-1]+2;
                _prev.textContent = textBefore.substring(0, newIndex);
                _next.textContent = textBefore.substring(newIndex+1)
                                   + _caret.textContent
                                   + _next.textContent;
                _caret.textContent = textBefore.charAt(newIndex);

                _caret.classList.remove("term-blink");
                setTimeout(function() {
                    _caret.classList.add("term-blink")
                }, 1000);
            } else {
                // if there was no word separation, perform as if
                // the home button was pressed
                _terminal.home();
            }
        };

        _terminal.moveRight = function() {
            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;

            if(textAfter == "") {
                _terminal.end();
                return;
            }

            var firstChar = textAfter.slice(0,1);
            _prev.textContent = textBefore+_caret.textContent;
            if(firstChar == "") {
                firstChar = " ";
            }
            _caret.textContent = firstChar;
            _next.textContent = textAfter.slice(1);

            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
        };

        _terminal.skipRight = function() {
            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;

            match = _skipPattern.exec(textAfter);
            if(match) {
                // if there was a word separation, jump there
                var newIndex = match.index+1;
                _prev.textContent = textBefore + _caret.textContent
                                + textAfter.substring(0, newIndex);
                _next.textContent = textAfter.substring(newIndex+1);
                _caret.textContent = textAfter.charAt(newIndex);
            } else {
                // if there was no word separation, perform as if
                // the home button was pressed
                _terminal.end();
            }
        };

        _terminal.home = function() {
            var textBefore = _prev.textContent;
            var firstChar = _prev.textContent.slice(0, 1);
            if(firstChar == "") return;

            if(_next.textContent == "") _caret.textContent = "";

            _next.textContent = textBefore.slice(1)
                             + _caret.textContent
                             + _next.textContent;
            _caret.textContent = firstChar;
            _prev.textContent = "";

            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
        };

        _terminal.end = function() {
            if (_next.textContent == "" && _caret.textContent == " ") return;

            _prev.textContent = _prev.textContent
                                + _caret.textContent
                                + _next.textContent;

            _caret.textContent = " ";
            _next.textContent = "";

            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
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

    function setOptionDefaults(options) {
        if(!options.prompt) options.prompt = '> ';
        if(!options.historySize) options.historySize = 100;

        if(!options.processCommand) {
            options.processCommand = function(cmd){
                console.log(cmd);
            };
        }
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

    function parseBashString(cmdString, i) {
        var startIndex = i;
        var escaped = false;
        for(; i < cmdString.length; i++) {
            if(!escaped && cmdString.charAt(i) == "\\") {
                escaped = true;
                continue;
            }
            if(!escaped && cmdString.charAt(i) == "\"") {
                break;
            }
            escaped = false;
        }
        return {
            arg : cmdString.slice(startIndex, i),
            i : i+1
        };
    }

    function parseBashArgs(cmdString) {
        var outputArgs = [];
        var escaped = false;
        var inString = false;
        var startIndex = 0;
        for(var i = 0; i < cmdString.length; i++) {
            if(cmdString.charAt(i) == "\"") {
                result = parseBashString(cmdString, i+1);
                outputArgs.push(result.arg);
                i = result.i;
                startIndex = i;
            }
            else if(cmdString.charAt(i) == "\\") {
                escaped = !escaped;
            }
            else if(!inString && cmdString.charAt(i) == " " && !escaped) {
                var arg = cmdString.slice(startIndex, i);
                outputArgs.push(arg.replace("\\ ", " "));
                startIndex = i + 1;
            }
        }
        var endString = cmdString.slice(startIndex, cmdString.length);
        if(endString != "") {
            outputArgs.push(endString.replace("\\ ", " "));
        }
        return outputArgs;
    }
    // -------------------------------------------------------------------------

    node = getNodeArg(node);
    node.w3term = new Terminal(node, options);
    return node;
}
