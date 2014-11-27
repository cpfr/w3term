w3term
======

Javascript Web Terminal
-----------------------
This terminal is intended to support the emulation of an interactive shell like many scripting languages or the operating systems themselves provide. 

[Live Demo](http://htmlpreview.github.io/?https://github.com/tuschcarsten/w3term/blob/master/index.html)

Features
--------
- Text input
- Paste text using CTRL+V
- TAB indents 4 spaces
- SHIFT+TAB dedents up to 4 spaces
- HOME / END jump to start / end of line
- Navigation using arrow keys
- Quick navigation between words using CTRL+LEFT / CTRL+RIGHT
- Browsing through command history using UP and DOWN keys
- Commiting commands using RETURN
- Bind a callback function which evaluates the commands and implements behavior.
- Compatible with non-keyboard devices

Requirements
------------
- Requires JQuery

Tested in:
----------
- Firefox 33.0
- Chromium 37.0
- Chrome 18.0
- Opera 12.16
- Android 4.04 Browser
- Internet Explorer 11.0.14


Documentation
=============

Method Summary
--------------
- ``terminal.init(element, options)``<br/>
  Replaces the given element with a terminal.

    - ``element``<br/>
      An element or a selector for the element which should be
      converted into a terminal.

    - ``options`` [optional]<br/>
      A Javascript object which defines the behavior of the
      terminal. Possible values are:

        - ``prompt``:
          (string) The prompt symbol
          <i>(default=``"> "``)</i>

        - ``historySize``:
          (int) The number of commands which can be stored
          within the command history.
          <i>(default=``100``)</i>

        - ``processCommand``:
          (function(cmd, term)) A handler function which
          receives a command from the terminal and may
          process them. The second parameter is optional
          and will receive the terminal object which sent
          the command.
          <i>
              (writes the command to the JS console
              by default)
          </i>

- ``terminal.setInput(_terminal, text)``<br/>
  Sets the prompt line of the given terminal to the given text.

    - ``_terminal``<br/>
      The terminal element which should be modified

    - ``text``<br/>
      The text which should be set as current line

- ``terminal.clear(_terminal)``<br/>
  Clears the contents of the given terminal.

    - ``_terminal``<br/>
      The terminal element which should be modified

- ``terminal.print(_terminal, text)``<br/>
  Prints a line of text into the given terminal.

    - ``_terminal``<br/>
      The terminal element which should be modified

    - ``text``<br/>
      The text which should be printed

- ``terminal.setOptionsDefault(_terminal)``<br/>
  Sets the terminal options to default.

    - ``_terminal``<br/>
      The terminal element which should be modified

- ``terminal.setOptions(_terminal, options)``<br/>
  Sets the terminal options to the given options.

    - ``_terminal``<br/>
      The terminal element which should be modified
      
    - ``options``<br/>
      A Javascript object which defines the behavior of the
      terminal. Possible values are:

        - ``prompt``:
          (string) The prompt symbol
          <i>(default=``"> "``)</i>

        - ``historySize``:
          (int) The number of commands which can be stored
          within the command history.
          <i>(default=``100``)</i>

        - ``processCommand``:
          (function(cmd, term)) A handler function which
          receives a command from the terminal and may
          process them. The second parameter is optional
          and will receive the terminal object which sent
          the command.
          <i>
              (writes the command to the JS console
              by default)
          </i>
