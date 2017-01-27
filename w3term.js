window.w3term = function(node){
    function Terminal(node) {
        // ---------------------------------------------------------------------
        var _commandHistory = [];
        var _commandStep = 0;
        var _terminal = this; // because this scoping is broken in JS
        // ---------------------------------------------------------------------

        var _hiddenInput;
        var _currentLine;
        var _prompt;
        var _prev;
        var _caret;
        var _next;
        // ---------------------------------------------------------------------

        node.className += " w3term";
        // ---------------------------------------------------------------------

        _hiddenInput = document.createElement("input");
        _hiddenInput.type = "text";
        _hiddenInput.className = "hiddenInput";

        _currentLine = document.createElement("span");
        _currentLine.className = "currentLine";
        _currentLine.tabindex = 0;

        _prompt = document.createElement("span");
        _prompt.className = "prompt";
        _prompt.textContent = ">"; // TODO: read options here

        _prev = document.createElement("span");
        _next = document.createElement("span");
        _caret = document.createElement("span");
        _caret.className = "textcursor term-blink end";

        _currentLine.appendChild(_prompt);
        _currentLine.appendChild(_prev);
        _currentLine.appendChild(_caret);
        _currentLine.appendChild(_next);
        node.appendChild(_hiddenInput);
        node.appendChild(_currentLine);

        // --- define public methods -------------------------------------------

        _terminal.backspace = function() {
            _prev.textContent = textBefore.slice(0,-1);
        };

        _terminal.delete = function() {
            _caret.textContent = textAfter.slice(0,1);
            _next.textContent = textAfter.slice(1);
        };

        _terminal.moveLeft = function() {
            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;
            var lastChar = textBefore.slice(-1);

            if(lastChar == '') return;

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

            if(textBefore == '') return;

            var pattern = /([A-Za-z][^A-Za-z]|[0-9][^0-9])/g;
            var matches = [];
            while ((match = pattern.exec(textBefore)) != null){
                matches.push(match.index);
            }
            if(matches.length > 0) {
                // if there was a word separation, jump there
                var newIndex = matches[matches.length-1]+1;
                _prev.textContent = textBefore.substring(0,newIndex);
                _next.textContent(textBefore.substring(newIndex+1)
                                   +_caret.textContent
                                   +_next.textContent);
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

            var firstChar = textAfter.slice(0,1);
            _prev.textContent = textBefore+_caret.text();
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

            var pattern = /([A-Za-z][^A-Za-z]|[0-9][^0-9])/g;
            match = pattern.exec(textAfter);
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
            // TODO
            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
        };

        _terminal.end = function() {
            // TODO
            _caret.classList.remove("term-blink");
            setTimeout(function() {
                _caret.classList.add("term-blink")
            }, 1000);
        };


        // --- define handlers -------------------------------------------------
        // set focus to currentLine when terminal is clicked -------------------
        node.onclick = function(evt) {
            _hiddenInput.focus();
        };

        // Insert Charcters when a key is pressed ------------------------------
        node.onchange = function(evt){
            _prev.textContent += _hiddenInput.value;
            _hiddenInput.value = "";
        };

        // Catch special keys before a character is inserted -------------------
        node.onkeydown = function(evt){
            // TODO: determine whether we need something similar here...
            // if(!_currentLine.is(":visible")){
            //     return;
            // }
            var char = evt.keyCode;

            var textBefore = _prev.textContent;
            var textAfter = _next.textContent;

            switch(char){
                case 8: // BACKSPACE
                    evt.preventDefault();
                    _terminal.backspace();
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
                    if(evt.ctrlKey) {
                        _terminal.skipLeft();
                    }
                    // if not, we just move one character to the left
                    else {
                        _terminal.moveLeft();
                    }
                    break;
                case 39: // RIGHT
                    evt.preventDefault();
                    // if the ctrl key is pressed, we move until the next
                    // non-character symbol
                    if(evt.ctrlKey){
                        _terminal.skipRight();
                    }
                    else{
                        _terminal.moveRight();
                    }
                    break;
                // case 38: // UP
                //     evt.preventDefault();
                //     var step = node.data('commandStep');
                //     if(step > 0){
                //         step--;
                //         terminal.setInput(node,
                //                  node.data('commandHistory')[step]);
                //         node.data('commandStep', step);
                //     }
                //     break;
                // case 40: // DOWN
                //     evt.preventDefault();
                //     var step = node.data('commandStep');
                //     if(step < node.data('commandHistory').length){
                //         step++;
                //         if(step == node.data('commandHistory').length){
                //             terminal.setInput(node, '');
                //         } else {
                //             terminal.setInput(node,
                //                     node.data('commandHistory')[step]);
                //         }
                //         node.data('commandStep', step);
                //     }
                //     break;
                // case 35: // END
                //     evt.preventDefault();
                //     if(_caret.hasClass('end')){return;}
                //     _caret.prev().text(textBefore+_caret.text()+textAfter);
                //     _caret.addClass('end');
                //     _caret.text(' ');
                //     _caret.next().text('');
                //     _caret.removeClass('term-blink');
                //     setTimeout(function(){_caret.addClass('term-blink')}, 1000);
                //     break;
                // case 36: // HOME
                //     evt.preventDefault();
                //     var firstChar = textBefore.slice(0,1);
                //     if(firstChar == ''){return;}
                //     if(_caret.hasClass('end'))
                //     {
                //         _caret.text('');
                //         _caret.removeClass('end');
                //     }
                //     _caret.next().text(textBefore.slice(1)
                //                       + _caret.text()
                //                       + textAfter);
                //     _caret.text(firstChar);
                //     _caret.prev().text('');
                //     _caret.removeClass('term-blink');
                //     setTimeout(function(){_caret.addClass('term-blink')}, 1000);
                //     break;
                // case 13: // ENTER
                //     evt.preventDefault();
                //     var textWhole = (textBefore+_caret.text()+textAfter).trim();
                //     _caret.parent().before('<p><span class="prompt">'
                //                           +node.data('options').prompt
                //                           +'</span>'+textWhole+'</p>');
                //     // new empty line
                //     _caret.prev().text('');
                //     _caret.next().text('');
                //     _caret.text(' ');
                //     _caret.addClass('end');
                //
                //     if(textWhole != ''){
                //         var commandCount = node.data(
                //                                     'commandHistory').length;
                //
                //         if(textWhole !=
                //         node.data('commandHistory')[commandCount-1])
                //         {
                //             // limit the size of the command history
                //             if(commandCount >= node.data('options')
                //                 .historySize){
                //                 node.data('commandHistory').shift();
                //             }
                //             node.data('commandHistory').push(textWhole);
                //         }
                //         node.data('commandStep',
                //                     node.data('commandHistory').length);
                //
                //         // process command
                //         node.data('options').processCommand(
                //             textWhole, node);
                //     }
                //     _prompt.text(node.data('options').prompt);
                //     node.scrollTop(_terminal.prop("scrollHeight"));
                //     break;
                default:
                    break;
            }
        }
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
    // -------------------------------------------------------------------------

    node = getNodeArg(node);
    node.w3term = new Terminal(node);
}
