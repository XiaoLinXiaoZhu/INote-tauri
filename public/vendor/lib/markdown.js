// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// xml
!(function () {
  var N = {
      autoSelfClosers: {
        area: !0,
        base: !0,
        br: !0,
        col: !0,
        command: !0,
        embed: !0,
        frame: !0,
        hr: !0,
        img: !0,
        input: !0,
        keygen: !0,
        link: !0,
        meta: !0,
        param: !0,
        source: !0,
        track: !0,
        wbr: !0,
        menuitem: !0,
      },
      implicitlyClosed: {
        dd: !0,
        li: !0,
        optgroup: !0,
        option: !0,
        p: !0,
        rp: !0,
        rt: !0,
        tbody: !0,
        td: !0,
        tfoot: !0,
        th: !0,
        tr: !0,
      },
      contextGrabbers: {
        dd: { dd: !0, dt: !0 },
        dt: { dd: !0, dt: !0 },
        li: { li: !0 },
        option: { option: !0, optgroup: !0 },
        optgroup: { optgroup: !0 },
        p: {
          address: !0,
          article: !0,
          aside: !0,
          blockquote: !0,
          dir: !0,
          div: !0,
          dl: !0,
          fieldset: !0,
          footer: !0,
          form: !0,
          h1: !0,
          h2: !0,
          h3: !0,
          h4: !0,
          h5: !0,
          h6: !0,
          header: !0,
          hgroup: !0,
          hr: !0,
          menu: !0,
          nav: !0,
          ol: !0,
          p: !0,
          pre: !0,
          section: !0,
          table: !0,
          ul: !0,
        },
        rp: { rp: !0, rt: !0 },
        rt: { rp: !0, rt: !0 },
        tbody: { tbody: !0, tfoot: !0 },
        td: { td: !0, th: !0 },
        tfoot: { tbody: !0 },
        th: { td: !0, th: !0 },
        thead: { tbody: !0, tfoot: !0 },
        tr: { tr: !0 },
      },
      doNotIndent: { pre: !0 },
      allowUnquoted: !0,
      allowMissing: !0,
      caseFold: !0,
    },
    M = {
      autoSelfClosers: {},
      implicitlyClosed: {},
      contextGrabbers: {},
      doNotIndent: {},
      allowUnquoted: !1,
      allowMissing: !1,
      allowMissingTagName: !1,
      caseFold: !1,
    };
  (CodeMirror.defineMode("xml", function (t, e) {
    var r,
      a,
      i,
      l = t.indentUnit,
      u = {},
      n = e.htmlMode ? N : M;
    for (r in n) u[r] = n[r];
    for (r in e) u[r] = e[r];
    function d(e, r) {
      function t(t) {
        return (r.tokenize = t)(e, r);
      }
      var n = e.next();
      if ("<" == n)
        return e.eat("!")
          ? e.eat("[")
            ? e.match("CDATA[")
              ? t(o("atom", "]]>"))
              : null
            : e.match("--")
              ? t(o("comment", "--\x3e"))
              : e.match("DOCTYPE", !0, !0)
                ? (e.eatWhile(/[\w\._\-]/),
                  t(
                    (function n(o) {
                      return function (t, e) {
                        for (var r; null != (r = t.next()); ) {
                          if ("<" == r)
                            return ((e.tokenize = n(o + 1)), e.tokenize(t, e));
                          if (">" == r) {
                            if (1 != o)
                              return (
                                (e.tokenize = n(o - 1)),
                                e.tokenize(t, e)
                              );
                            e.tokenize = d;
                            break;
                          }
                        }
                        return "meta";
                      };
                    })(1),
                  ))
                : null
          : e.eat("?")
            ? (e.eatWhile(/[\w\._\-]/), (r.tokenize = o("meta", "?>")), "meta")
            : ((a = e.eat("/") ? "closeTag" : "openTag"),
              (r.tokenize = s),
              "tag bracket");
      if ("&" != n) return (e.eatWhile(/[^&<]/), null);
      n = e.eat("#")
        ? e.eat("x")
          ? e.eatWhile(/[a-fA-F\d]/) && e.eat(";")
          : e.eatWhile(/[\d]/) && e.eat(";")
        : e.eatWhile(/[\w\.\-:]/) && e.eat(";");
      return n ? "atom" : "error";
    }
    function s(t, e) {
      var r = t.next();
      if (">" == r || ("/" == r && t.eat(">")))
        return (
          (e.tokenize = d),
          (a = ">" == r ? "endTag" : "selfcloseTag"),
          "tag bracket"
        );
      if ("=" == r) return ((a = "equals"), null);
      if ("<" != r)
        return /[\'\"]/.test(r)
          ? ((e.tokenize = ((n = r), (o.isInAttribute = !0), o)),
            (e.stringStartCol = t.column()),
            e.tokenize(t, e))
          : (t.match(/^[^\s\u00a0=<>\"\']*[^\s\u00a0=<>\"\'\/]/), "word");
      ((e.tokenize = d), (e.state = p), (e.tagName = e.tagStart = null));
      var n,
        e = e.tokenize(t, e);
      return e ? e + " tag error" : "tag error";
      function o(t, e) {
        for (; !t.eol(); )
          if (t.next() == n) {
            e.tokenize = s;
            break;
          }
        return "string";
      }
    }
    function o(r, n) {
      return function (t, e) {
        for (; !t.eol(); ) {
          if (t.match(n)) {
            e.tokenize = d;
            break;
          }
          t.next();
        }
        return r;
      };
    }
    function c(t) {
      return t && t.toLowerCase();
    }
    function f(t, e, r) {
      ((this.prev = t.context),
        (this.tagName = e || ""),
        (this.indent = t.indented),
        (this.startOfLine = r),
        (u.doNotIndent.hasOwnProperty(e) ||
          (t.context && t.context.noIndent)) &&
          (this.noIndent = !0));
    }
    function m(t) {
      t.context && (t.context = t.context.prev);
    }
    function g(t, e) {
      for (var r; ; ) {
        if (!t.context) return;
        if (
          ((r = t.context.tagName),
          !u.contextGrabbers.hasOwnProperty(c(r)) ||
            !u.contextGrabbers[c(r)].hasOwnProperty(c(e)))
        )
          return;
        m(t);
      }
    }
    function p(t, e, r) {
      return "openTag" == t
        ? ((r.tagStart = e.column()), h)
        : "closeTag" == t
          ? x
          : p;
    }
    function h(t, e, r) {
      return "word" == t
        ? ((r.tagName = e.current()), (i = "tag"), w)
        : u.allowMissingTagName && "endTag" == t
          ? ((i = "tag bracket"), w(t, 0, r))
          : ((i = "error"), h);
    }
    function x(t, e, r) {
      if ("word" != t)
        return u.allowMissingTagName && "endTag" == t
          ? ((i = "tag bracket"), b(t, 0, r))
          : ((i = "error"), k);
      e = e.current();
      return (
        r.context &&
          r.context.tagName != e &&
          u.implicitlyClosed.hasOwnProperty(c(r.context.tagName)) &&
          m(r),
        (r.context && r.context.tagName == e) || !1 === u.matchClosing
          ? ((i = "tag"), b)
          : ((i = "tag error"), k)
      );
    }
    function b(t, e, r) {
      return "endTag" != t ? ((i = "error"), b) : (m(r), p);
    }
    function k(t, e, r) {
      return ((i = "error"), b(t, 0, r));
    }
    function w(t, e, r) {
      if ("word" == t) return ((i = "attribute"), C);
      if ("endTag" != t && "selfcloseTag" != t) return ((i = "error"), w);
      var n = r.tagName,
        o = r.tagStart;
      return (
        (r.tagName = r.tagStart = null),
        "selfcloseTag" == t || u.autoSelfClosers.hasOwnProperty(c(n))
          ? g(r, n)
          : (g(r, n), (r.context = new f(r, n, o == r.indented))),
        p
      );
    }
    function C(t, e, r) {
      return "equals" == t ? T : (u.allowMissing || (i = "error"), w(t, 0, r));
    }
    function T(t, e, r) {
      return "string" == t
        ? v
        : "word" == t && u.allowUnquoted
          ? ((i = "string"), w)
          : ((i = "error"), w(t, 0, r));
    }
    function v(t, e, r) {
      return "string" == t ? v : w(t, 0, r);
    }
    return (
      (d.isInText = !0),
      {
        startState: function (t) {
          var e = {
            tokenize: d,
            state: p,
            indented: t || 0,
            tagName: null,
            tagStart: null,
            context: null,
          };
          return (null != t && (e.baseIndent = t), e);
        },
        token: function (t, e) {
          if (
            (!e.tagName && t.sol() && (e.indented = t.indentation()),
            t.eatSpace())
          )
            return null;
          a = null;
          var r = e.tokenize(t, e);
          return (
            (r || a) &&
              "comment" != r &&
              ((i = null),
              (e.state = e.state(a || r, t, e)),
              i && (r = "error" == i ? r + " error" : i)),
            r
          );
        },
        indent: function (t, e, r) {
          var n = t.context;
          if (t.tokenize.isInAttribute)
            return t.tagStart == t.indented
              ? t.stringStartCol + 1
              : t.indented + l;
          if (n && n.noIndent) return CodeMirror.Pass;
          if (t.tokenize != s && t.tokenize != d)
            return r ? r.match(/^(\s*)/)[0].length : 0;
          if (t.tagName)
            return !1 !== u.multilineTagIndentPastTag
              ? t.tagStart + t.tagName.length + 2
              : t.tagStart + l * (u.multilineTagIndentFactor || 1);
          if (u.alignCDATA && /<!\[CDATA\[/.test(e)) return 0;
          var o = e && /^<(\/)?([\w_:\.-]*)/.exec(e);
          if (o && o[1])
            for (; n; ) {
              if (n.tagName == o[2]) {
                n = n.prev;
                break;
              }
              if (!u.implicitlyClosed.hasOwnProperty(c(n.tagName))) break;
              n = n.prev;
            }
          else if (o)
            for (; n; ) {
              var a = u.contextGrabbers[c(n.tagName)];
              if (!a || !a.hasOwnProperty(c(o[2]))) break;
              n = n.prev;
            }
          for (; n && n.prev && !n.startOfLine; ) n = n.prev;
          return n ? n.indent + l : t.baseIndent || 0;
        },
        electricInput: /<\/[\s\w:]+>$/,
        blockCommentStart: "\x3c!--",
        blockCommentEnd: "--\x3e",
        configuration: u.htmlMode ? "html" : "xml",
        helperType: u.htmlMode ? "html" : "xml",
        skipAttribute: function (t) {
          t.state == T && (t.state = w);
        },
        xmlCurrentTag: function (t) {
          return t.tagName
            ? { name: t.tagName, close: "closeTag" == t.type }
            : null;
        },
        xmlCurrentContext: function (t) {
          for (var e = [], r = t.context; r; r = r.prev) e.push(r.tagName);
          return e.reverse();
        },
      }
    );
  }),
    CodeMirror.defineMIME("text/xml", "xml"),
    CodeMirror.defineMIME("application/xml", "xml"),
    CodeMirror.mimeModes.hasOwnProperty("text/html") ||
      CodeMirror.defineMIME("text/html", { name: "xml", htmlMode: !0 }));
})();
// htmlmixed
!(function () {
  var l = {
    script: [
      ["lang", /(javascript|babel)/i, "javascript"],
      [
        "type",
        /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i,
        "javascript",
      ],
      ["type", /./, "text/plain"],
      [null, null, "javascript"],
    ],
    style: [
      ["lang", /^css$/i, "css"],
      ["type", /^(text\/)?(x-)?(stylesheet|css)$/i, "css"],
      ["type", /./, "text/plain"],
      [null, null, "css"],
    ],
  };
  var a = {};
  function d(t, e) {
    e = t.match(
      a[(e = e)] ||
        (a[e] = new RegExp(
          "\\s+" + e + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*",
        )),
    );
    return e ? /^\s*(.*?)\s*$/.exec(e[2])[1] : "";
  }
  function m(t, e) {
    return new RegExp((e ? "^" : "") + "</s*" + t + "s*>", "i");
  }
  function o(t, e) {
    for (var a in t)
      for (var n = e[a] || (e[a] = []), l = t[a], o = l.length - 1; 0 <= o; o--)
        n.unshift(l[o]);
  }
  (CodeMirror.defineMode(
    "htmlmixed",
    function (i, t) {
      var c = CodeMirror.getMode(i, {
          name: "xml",
          htmlMode: !0,
          multilineTagIndentFactor: t.multilineTagIndentFactor,
          multilineTagIndentPastTag: t.multilineTagIndentPastTag,
          allowMissingTagName: t.allowMissingTagName,
        }),
        s = {},
        e = t && t.tags,
        a = t && t.scriptTypes;
      if ((o(l, s), e && o(e, s), a))
        for (var n = a.length - 1; 0 <= n; n--)
          s.script.unshift(["type", a[n].matches, a[n].mode]);
      function u(t, e) {
        var a,
          o,
          r,
          n = c.token(t, e.htmlState),
          l = /\btag\b/.test(n);
        return (
          l &&
          !/[<>\s\/]/.test(t.current()) &&
          (a = e.htmlState.tagName && e.htmlState.tagName.toLowerCase()) &&
          s.hasOwnProperty(a)
            ? (e.inTag = a + " ")
            : e.inTag && l && />$/.test(t.current())
              ? ((a = /^([\S]+) (.*)/.exec(e.inTag)),
                (e.inTag = null),
                (l =
                  ">" == t.current() &&
                  (function (t, e) {
                    for (var a = 0; a < t.length; a++) {
                      var n = t[a];
                      if (!n[0] || n[1].test(d(e, n[0]))) return n[2];
                    }
                  })(s[a[1]], a[2])),
                (l = CodeMirror.getMode(i, l)),
                (o = m(a[1], !0)),
                (r = m(a[1], !1)),
                (e.token = function (t, e) {
                  return t.match(o, !1)
                    ? ((e.token = u), (e.localState = e.localMode = null))
                    : ((a = t),
                      (n = r),
                      (l = e.localMode.token(t, e.localState)),
                      (t = a.current()),
                      -1 < (e = t.search(n))
                        ? a.backUp(t.length - e)
                        : t.match(/<\/?$/) &&
                          (a.backUp(t.length), a.match(n, !1) || a.match(t)),
                      l);
                  var a, n, l;
                }),
                (e.localMode = l),
                (e.localState = CodeMirror.startState(
                  l,
                  c.indent(e.htmlState, "", ""),
                )))
              : e.inTag &&
                ((e.inTag += t.current()), t.eol() && (e.inTag += " ")),
          n
        );
      }
      return {
        startState: function () {
          return {
            token: u,
            inTag: null,
            localMode: null,
            localState: null,
            htmlState: CodeMirror.startState(c),
          };
        },
        copyState: function (t) {
          var e;
          return (
            t.localState &&
              (e = CodeMirror.copyState(t.localMode, t.localState)),
            {
              token: t.token,
              inTag: t.inTag,
              localMode: t.localMode,
              localState: e,
              htmlState: CodeMirror.copyState(c, t.htmlState),
            }
          );
        },
        token: function (t, e) {
          return e.token(t, e);
        },
        indent: function (t, e, a) {
          return !t.localMode || /^\s*<\//.test(e)
            ? c.indent(t.htmlState, e, a)
            : t.localMode.indent
              ? t.localMode.indent(t.localState, e, a)
              : CodeMirror.Pass;
        },
        innerMode: function (t) {
          return { state: t.localState || t.htmlState, mode: t.localMode || c };
        },
      };
    },
    "xml",
    "javascript",
    "css",
  ),
    CodeMirror.defineMIME("text/html", "htmlmixed"));
})();
// yaml
(CodeMirror.defineMode("yaml", function () {
  var n = new RegExp(
    "\\b((" + ["true", "false", "on", "off", "yes", "no"].join(")|(") + "))$",
    "i",
  );
  return {
    token: function (e, i) {
      var t = e.peek(),
        r = i.escaped;
      if (
        ((i.escaped = !1),
        "#" == t && (0 == e.pos || /\s/.test(e.string.charAt(e.pos - 1))))
      )
        return (e.skipToEnd(), "comment");
      if (e.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/)) return "string";
      if (i.literal && e.indentation() > i.keyCol)
        return (e.skipToEnd(), "string");
      if ((i.literal && (i.literal = !1), e.sol())) {
        if (((i.keyCol = 0), (i.pair = !1), (i.pairStart = !1), e.match("---")))
          return "def";
        if (e.match("...")) return "def";
        if (e.match(/\s*-\s+/)) return "meta";
      }
      if (e.match(/^(\{|\}|\[|\])/))
        return (
          "{" == t
            ? i.inlinePairs++
            : "}" == t
              ? i.inlinePairs--
              : "[" == t
                ? i.inlineList++
                : i.inlineList--,
          "meta"
        );
      if (0 < i.inlineList && !r && "," == t) return (e.next(), "meta");
      if (0 < i.inlinePairs && !r && "," == t)
        return (
          (i.keyCol = 0),
          (i.pair = !1),
          (i.pairStart = !1),
          e.next(),
          "meta"
        );
      if (i.pairStart) {
        if (e.match(/^\s*(\||\>)\s*/)) return ((i.literal = !0), "meta");
        if (e.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) return "variable-2";
        if (0 == i.inlinePairs && e.match(/^\s*-?[0-9\.\,]+\s?$/))
          return "number";
        if (0 < i.inlinePairs && e.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/))
          return "number";
        if (e.match(n)) return "keyword";
      }
      return !i.pair &&
        e.match(
          /^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/,
        )
        ? ((i.pair = !0), (i.keyCol = e.indentation()), "atom")
        : i.pair && e.match(/^:\s*/)
          ? ((i.pairStart = !0), "meta")
          : ((i.pairStart = !1), (i.escaped = "\\" == t), e.next(), null);
    },
    startState: function () {
      return {
        pair: !1,
        pairStart: !1,
        keyCol: 0,
        inlinePairs: 0,
        inlineList: 0,
        literal: !1,
        escaped: !1,
      };
    },
    lineComment: "#",
    fold: "indent",
  };
}),
  CodeMirror.defineMIME("text/x-yaml", "yaml"),
  CodeMirror.defineMIME("text/yaml", "yaml"));

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object")
    // CommonJS
    mod(
      require("../../lib/codemirror"),
      require("../xml/xml"),
      require("../meta"),
    );
  else if (typeof define == "function" && define.amd)
    // AMD
    define(["../../lib/codemirror", "../xml/xml", "../meta"], mod); // Plain browser env
  else mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode(
    "markdown",
    function (cmCfg, modeCfg) {
      var htmlMode = CodeMirror.getMode(cmCfg, "text/html");
      var htmlModeMissing = htmlMode.name == "null";

      function getMode(name) {
        if (CodeMirror.findModeByName) {
          var found = CodeMirror.findModeByName(name);
          if (found) name = found.mime || found.mimes[0];
        }
        var mode = CodeMirror.getMode(cmCfg, name);
        return mode.name == "null" ? null : mode;
      }

      // Should characters that affect highlighting be highlighted separate?
      // Does not include characters that will be output (such as `1.` and `-` for lists)
      if (modeCfg.highlightFormatting === undefined)
        modeCfg.highlightFormatting = false;

      // Maximum number of nested blockquotes. Set to 0 for infinite nesting.
      // Excess `>` will emit `error` token.
      if (modeCfg.maxBlockquoteDepth === undefined)
        modeCfg.maxBlockquoteDepth = 0;

      // Turn on task lists? ("- [ ] " and "- [x] ")
      if (modeCfg.taskLists === undefined) modeCfg.taskLists = false;

      // Turn on strikethrough syntax
      if (modeCfg.strikethrough === undefined) modeCfg.strikethrough = false;

      if (modeCfg.emoji === undefined) modeCfg.emoji = false;

      if (modeCfg.fencedCodeBlockHighlighting === undefined)
        modeCfg.fencedCodeBlockHighlighting = true;

      if (modeCfg.xml === undefined) modeCfg.xml = true;

      // Allow token types to be overridden by user-provided token types.
      if (modeCfg.tokenTypeOverrides === undefined)
        modeCfg.tokenTypeOverrides = {};

      var tokenTypes = {
        header: "header",
        code: "comment",
        quote: "quote",
        list1: "variable-2",
        list2: "variable-3",
        list3: "keyword",
        hr: "hr",
        image: "image",
        imageAltText: "image-alt-text",
        imageMarker: "image-marker",
        formatting: "formatting",
        linkInline: "link",
        linkEmail: "link",
        linkText: "link",
        linkHref: "string",
        em: "em",
        strong: "strong",
        strikethrough: "strikethrough",
        emoji: "builtin",
        highlight: "highlight",
      };

      for (var tokenType in tokenTypes) {
        if (
          tokenTypes.hasOwnProperty(tokenType) &&
          modeCfg.tokenTypeOverrides[tokenType]
        ) {
          tokenTypes[tokenType] = modeCfg.tokenTypeOverrides[tokenType];
        }
      }

      var hrRE = /^([*\-_])(?:\s*\1){2,}\s*$/,
        listRE = /^(?:[*\-+]|^[0-9]+([.)]))\s+/,
        taskListRE = /^\[(.)\](?=\s)/i, // Must follow listRE
        atxHeaderRE = modeCfg.allowAtxHeaderWithoutSpace
          ? /^(#+)/
          : /^(#+)(?: |$)/,
        setextHeaderRE = /^ {0,3}(?:\={1,}|-{2,})\s*$/,
        textRE = /^[^#!\[\]*_\\<>` "'(~:=|$%^]+/,
        fencedCodeRE = /^(~~~+|```+)[ \t]*([\w\/+#-]*)[^\n`]*$/,
        linkDefRE = /^\s*\[[^\]]+?\]:.*$/, // naive link-definition
        punctuation =
          /[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/,
        expandedTab = "    ", // CommonMark specifies tab as 4 spaces
        escapableRE = /^[\\`*{}\[\]()#+-.!_>~|\n"$%&',\/:;<=?@^]/; // escapable chars as defined by CommonMark

      function switchInline(stream, state, f) {
        state.f = state.inline = f;
        return f(stream, state);
      }

      function switchBlock(stream, state, f) {
        state.f = state.block = f;
        return f(stream, state);
      }

      function lineIsEmpty(line) {
        return !line || !/\S/.test(line.string);
      }

      // Blocks

      function blankLine(state) {
        // Reset linkTitle state
        state.linkTitle = false;
        state.linkHref = false;
        state.linkText = false;
        // Reset EM state
        state.em = false;
        // Reset STRONG state
        state.strong = false;
        // Reset strikethrough state
        state.strikethrough = false;
        // Reset highlight state
        state.highlight = false;
        // Reset state.quote
        state.quote = 0;
        // Reset state.indentedCode
        state.indentedCode = false;
        if (state.f == htmlBlock) {
          var exit = htmlModeMissing;
          if (!exit) {
            var inner = CodeMirror.innerMode(htmlMode, state.htmlState);
            exit =
              inner.mode.name == "xml" &&
              inner.state.tagStart === null &&
              !inner.state.context &&
              inner.state.tokenize.isInText;
          }
          if (exit) {
            state.f = inlineNormal;
            state.block = blockNormal;
            state.htmlState = null;
          }
        }
        // Reset state.trailingSpace
        state.trailingSpace = 0;
        state.trailingSpaceNewLine = false;
        // Mark this line as blank
        state.prevLine = state.thisLine;
        state.thisLine = { stream: null };
        return null;
      }

      function blockNormal(stream, state) {
        var firstTokenOnLine = stream.column() === state.indentation;
        var prevLineLineIsEmpty = lineIsEmpty(state.prevLine.stream);
        var prevLineIsIndentedCode = state.indentedCode;
        var prevLineIsHr = state.prevLine.hr;
        var prevLineIsList = state.list !== false;
        var maxNonCodeIndentation =
          (state.listStack[state.listStack.length - 1] || 0) + 3;

        state.indentedCode = false;

        var lineIndentation = state.indentation;
        // compute once per line (on first token)
        if (state.indentationDiff === null) {
          state.indentationDiff = state.indentation;
          if (prevLineIsList) {
            state.list = null;
            // While this list item's marker's indentation is less than the deepest
            //  list item's content's indentation,pop the deepest list item
            //  indentation off the stack, and update block indentation state
            while (
              lineIndentation < state.listStack[state.listStack.length - 1]
            ) {
              state.listStack.pop();
              if (state.listStack.length) {
                state.indentation = state.listStack[state.listStack.length - 1];
                // less than the first list's indent -> the line is no longer a list
              } else {
                state.list = false;
              }
            }
            if (state.list !== false) {
              state.indentationDiff =
                lineIndentation - state.listStack[state.listStack.length - 1];
            }
          }
        }

        // not comprehensive (currently only for setext detection purposes)
        var allowsInlineContinuation =
          !prevLineLineIsEmpty &&
          !prevLineIsHr &&
          !state.prevLine.header &&
          (!prevLineIsList || !prevLineIsIndentedCode) &&
          !state.prevLine.fencedCodeEnd;

        var isHr =
          (state.list === false || prevLineIsHr || prevLineLineIsEmpty) &&
          state.indentation <= maxNonCodeIndentation &&
          stream.match(hrRE);

        var match = null;
        if (
          state.indentationDiff >= 4 &&
          (prevLineIsIndentedCode ||
            state.prevLine.fencedCodeEnd ||
            state.prevLine.header ||
            prevLineLineIsEmpty)
        ) {
          stream.skipToEnd();
          state.indentedCode = true;
          return tokenTypes.code;
        } else if (stream.eatSpace()) {
          return null;
        } else if (
          firstTokenOnLine &&
          state.indentation <= maxNonCodeIndentation &&
          (match = stream.match(atxHeaderRE)) &&
          match[1].length <= 6
        ) {
          state.quote = 0;
          state.header = match[1].length;
          state.thisLine.header = true;
          if (modeCfg.highlightFormatting) state.formatting = "header";
          state.f = state.inline;
          return getType(state);
        } else if (
          state.indentation <= maxNonCodeIndentation &&
          stream.eat(">")
        ) {
          state.quote = firstTokenOnLine ? 1 : state.quote + 1;
          if (modeCfg.highlightFormatting) state.formatting = "quote";
          stream.eatSpace();
          return getType(state);
        } else if (
          !isHr &&
          !state.setext &&
          firstTokenOnLine &&
          state.indentation <= maxNonCodeIndentation &&
          (match = stream.match(listRE))
        ) {
          var listType = match[1] ? "ol" : "ul";

          state.indentation = lineIndentation + stream.current().length;
          state.list = true;
          state.quote = 0;

          // Add this list item's content's indentation to the stack
          state.listStack.push(state.indentation);
          // Reset inline styles which shouldn't propagate across list items
          state.em = false;
          state.strong = false;
          state.code = false;
          state.strikethrough = false;
          state.highlight = false;

          if (modeCfg.taskLists && stream.match(taskListRE, false)) {
            state.taskList = true;
          }
          state.f = state.inline;
          if (modeCfg.highlightFormatting)
            state.formatting = ["list", "list-" + listType];
          return getType(state);
        } else if (
          firstTokenOnLine &&
          state.indentation <= maxNonCodeIndentation &&
          (match = stream.match(fencedCodeRE, true))
        ) {
          state.quote = 0;
          state.fencedEndRE = new RegExp(match[1] + "+ *$");
          // try switching mode
          state.localMode =
            modeCfg.fencedCodeBlockHighlighting && getMode(match[2]);
          if (state.localMode)
            state.localState = CodeMirror.startState(state.localMode);
          state.f = state.block = local;
          if (modeCfg.highlightFormatting) state.formatting = "code-block";
          state.code = -1;
          return getType(state);
          // SETEXT has lowest block-scope precedence after HR, so check it after
          //  the others (code, blockquote, list...)
        } else if (
          // if setext set, indicates line after ---/===
          state.setext ||
          // line before ---/===
          ((!allowsInlineContinuation || !prevLineIsList) &&
            !state.quote &&
            state.list === false &&
            !state.code &&
            !isHr &&
            !linkDefRE.test(stream.string) &&
            (match = stream.lookAhead(1)) &&
            (match = match.match(setextHeaderRE)))
        ) {
          if (!state.setext) {
            state.header = match[0].charAt(0) == "=" ? 1 : 2;
            state.setext = state.header;
          } else {
            state.header = state.setext;
            // has no effect on type so we can reset it now
            state.setext = 0;
            stream.skipToEnd();
            if (modeCfg.highlightFormatting) state.formatting = "header";
          }
          state.thisLine.header = true;
          state.f = state.inline;
          return getType(state);
        } else if (isHr) {
          stream.skipToEnd();
          state.hr = true;
          state.thisLine.hr = true;
          return tokenTypes.hr;
        } else if (stream.peek() === "[") {
          return switchInline(stream, state, footnoteLink);
        }

        return switchInline(stream, state, state.inline);
      }

      function htmlBlock(stream, state) {
        var style = htmlMode.token(stream, state.htmlState);
        if (!htmlModeMissing) {
          var inner = CodeMirror.innerMode(htmlMode, state.htmlState);
          if (
            (inner.mode.name == "xml" &&
              inner.state.tagStart === null &&
              !inner.state.context &&
              inner.state.tokenize.isInText) ||
            (state.md_inside && stream.current().indexOf(">") > -1)
          ) {
            state.f = inlineNormal;
            state.block = blockNormal;
            state.htmlState = null;
          }
        }
        return style;
      }

      function local(stream, state) {
        var currListInd = state.listStack[state.listStack.length - 1] || 0;
        var hasExitedList = state.indentation < currListInd;
        var maxFencedEndInd = currListInd + 3;
        if (
          state.fencedEndRE &&
          state.indentation <= maxFencedEndInd &&
          (hasExitedList || stream.match(state.fencedEndRE))
        ) {
          if (modeCfg.highlightFormatting) state.formatting = "code-block";
          var returnType;
          if (!hasExitedList) returnType = getType(state);
          state.localMode = state.localState = null;
          state.block = blockNormal;
          state.f = inlineNormal;
          state.fencedEndRE = null;
          state.code = 0;
          state.thisLine.fencedCodeEnd = true;
          if (hasExitedList) return switchBlock(stream, state, state.block);
          return returnType;
        } else if (state.localMode) {
          return state.localMode.token(stream, state.localState);
        } else {
          stream.skipToEnd();
          return tokenTypes.code;
        }
      }

      // Inline
      function getType(state) {
        var styles = [];

        if (state.formatting) {
          styles.push(tokenTypes.formatting);

          if (typeof state.formatting === "string")
            state.formatting = [state.formatting];

          for (var i = 0; i < state.formatting.length; i++) {
            styles.push(tokenTypes.formatting + "-" + state.formatting[i]);

            if (state.formatting[i] === "header") {
              styles.push(
                tokenTypes.formatting +
                  "-" +
                  state.formatting[i] +
                  "-" +
                  state.header,
              );
            }

            // Add `formatting-quote` and `formatting-quote-#` for blockquotes
            // Add `error` instead if the maximum blockquote nesting depth is passed
            if (state.formatting[i] === "quote") {
              if (
                !modeCfg.maxBlockquoteDepth ||
                modeCfg.maxBlockquoteDepth >= state.quote
              ) {
                styles.push(
                  tokenTypes.formatting +
                    "-" +
                    state.formatting[i] +
                    "-" +
                    state.quote,
                );
              } else {
                styles.push("error");
              }
            }
          }
        }

        if (state.taskOpen) {
          styles.push("meta");
          return styles.length ? styles.join(" ") : null;
        }
        if (state.taskClosed) {
          styles.push("property");
          return styles.length ? styles.join(" ") : null;
        }

        // if (state.linkHref) {
        // 	styles.push(tokenTypes.linkHref, "url");
        // } else { // Only apply inline styles to non-url text
        if (state.linkHref) {
          styles.push(tokenTypes.linkHref, "url");
        }
        if (state.strong) {
          styles.push(tokenTypes.strong);
        }
        if (state.em) {
          styles.push(tokenTypes.em);
        }
        if (state.strikethrough) {
          styles.push(tokenTypes.strikethrough);
        }
        if (state.highlight) {
          styles.push(tokenTypes.highlight);
        }
        if (state.emoji) {
          styles.push(tokenTypes.emoji);
        }
        if (state.linkText) {
          styles.push(tokenTypes.linkText);
        }
        if (state.code) {
          styles.push(tokenTypes.code);
        }
        if (state.image) {
          styles.push(tokenTypes.image);
        }
        if (state.imageAltText) {
          styles.push(tokenTypes.imageAltText, "link");
        }
        if (state.imageMarker) {
          styles.push(tokenTypes.imageMarker);
        }
        // }

        if (state.header) {
          styles.push(
            tokenTypes.header,
            tokenTypes.header + "-" + state.header,
          );
        }

        if (state.quote) {
          styles.push(tokenTypes.quote);

          // Add `quote-#` where the maximum for `#` is modeCfg.maxBlockquoteDepth
          if (
            !modeCfg.maxBlockquoteDepth ||
            modeCfg.maxBlockquoteDepth >= state.quote
          ) {
            styles.push(tokenTypes.quote + "-" + state.quote);
          } else {
            styles.push(tokenTypes.quote + "-" + modeCfg.maxBlockquoteDepth);
          }
        }

        if (state.list !== false) {
          var listMod = (state.listStack.length - 1) % 3;
          if (!listMod) {
            styles.push(tokenTypes.list1);
          } else if (listMod === 1) {
            styles.push(tokenTypes.list2);
          } else {
            styles.push(tokenTypes.list3);
          }
        }

        if (state.trailingSpaceNewLine) {
          styles.push("trailing-space-new-line");
        } else if (state.trailingSpace) {
          styles.push(
            "trailing-space-" + (state.trailingSpace % 2 ? "a" : "b"),
          );
        }

        return styles.length ? styles.join(" ") : null;
      }

      function handleText(stream, state) {
        if (stream.match(textRE, true)) {
          return getType(state);
        }
        return undefined;
      }

      function inlineNormal(stream, state) {
        var style = state.text(stream, state);
        if (typeof style !== "undefined") return style;

        // fix " - [[link]]" not working as it returns too early
        if (state.list && !state.internalLink) {
          // List marker (*, +, -, 1., etc)
          state.list = null;
          return getType(state);
        }

        if (state.taskList) {
          var match = stream.match(taskListRE, true);
          state.taskList = false;
          if (match) {
            var taskOpen = match[1] === " ";
            if (taskOpen) state.taskOpen = true;
            else state.taskClosed = true;
            if (modeCfg.highlightFormatting) state.formatting = "task";
            return getType(state);
          }
        }

        state.taskOpen = false;
        state.taskClosed = false;

        if (state.header && stream.match(/^#+$/, true)) {
          if (modeCfg.highlightFormatting) state.formatting = "header";
          return getType(state);
        }

        var ch = stream.next();

        // Matches link titles present on next line
        if (state.linkTitle) {
          state.linkTitle = false;
          var matchCh = ch;
          if (ch === "(") {
            matchCh = ")";
          }
          matchCh = (matchCh + "").replace(/([.?*+^\[\]\\(){}|-])/g, "\\$1");
          var regex =
            "^\\s*(?:[^" + matchCh + "\\\\]+|\\\\\\\\|\\\\.)" + matchCh;
          if (stream.match(new RegExp(regex), true)) {
            return tokenTypes.linkHref;
          }
        }

        // If this block is changed, it may need to be updated in GFM mode
        if (ch === "`") {
          var previousFormatting = state.formatting;
          if (modeCfg.highlightFormatting) state.formatting = "code";
          stream.eatWhile("`");
          var count = stream.current().length;
          if (state.code == 0 && (!state.quote || count == 1)) {
            state.code = count;
            return getType(state);
          } else if (count == state.code) {
            // Must be exact
            var t = getType(state);
            state.code = 0;
            return t;
          } else {
            state.formatting = previousFormatting;
            return getType(state);
          }
        } else if (state.code) {
          return getType(state);
        }

        if (ch === "\\") {
          if (stream.match(escapableRE, true) && modeCfg.highlightFormatting) {
            var type = getType(state);
            var formattingEscape = tokenTypes.formatting + "-escape";
            return type ? type + " " + formattingEscape : formattingEscape;
          }
        }

        if (ch === "!" && stream.match(/\[[^\]]*\] ?(?:\(|\[)/, false)) {
          state.imageMarker = true;
          state.image = true;
          if (modeCfg.highlightFormatting) state.formatting = "image";
          return getType(state);
        }

        if (
          ch === "[" &&
          state.imageMarker &&
          stream.match(/[^\]]*\](\(.*?\)| ?\[.*?\])/, false)
        ) {
          state.imageMarker = false;
          state.imageAltText = true;
          if (modeCfg.highlightFormatting) state.formatting = "image";
          return getType(state);
        }

        if (ch === "]" && state.imageAltText) {
          if (modeCfg.highlightFormatting) state.formatting = "image";
          var type = getType(state);
          state.imageAltText = false;
          state.image = false;
          state.inline = state.f = linkHref;
          return type;
        }

        if (ch === "[" && !state.image && !state.internalLink) {
          if (state.linkText && stream.match(/^.*?\]/)) return getType(state);
          state.linkText = true;
          if (modeCfg.highlightFormatting) state.formatting = "link";
          return getType(state);
        }

        if (ch === "]" && state.linkText) {
          if (modeCfg.highlightFormatting) state.formatting = "link";
          var type = getType(state);
          state.linkText = false;
          state.inline = state.f = stream.match(/\(.*?\)| ?\[.*?\]/, false)
            ? linkHref
            : inlineNormal;
          return type;
        }

        if (
          ch === "<" &&
          stream.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/, false)
        ) {
          state.f = state.inline = linkInline;
          if (modeCfg.highlightFormatting) state.formatting = "link";
          var type = getType(state);
          if (type) {
            type += " ";
          } else {
            type = "";
          }
          return type + tokenTypes.linkInline;
        }

        if (ch === "<" && stream.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/, false)) {
          state.f = state.inline = linkInline;
          if (modeCfg.highlightFormatting) state.formatting = "link";
          var type = getType(state);
          if (type) {
            type += " ";
          } else {
            type = "";
          }
          return type + tokenTypes.linkEmail;
        }

        if (
          modeCfg.xml &&
          ch === "<" &&
          stream.match(
            /^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=\s*[^>]+)?)*\s*(?:>|$))/i,
            false,
          )
        ) {
          var end = stream.string.indexOf(">", stream.pos);
          if (end != -1) {
            var atts = stream.string.substring(stream.start, end);
            if (/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(atts))
              state.md_inside = true;
          }
          stream.backUp(1);
          state.htmlState = CodeMirror.startState(htmlMode);
          return switchBlock(stream, state, htmlBlock);
        }

        if (modeCfg.xml && ch === "<" && stream.match(/^\/\w*?>/)) {
          state.md_inside = false;
          return "tag";
        } else if (ch === "*" || ch === "_") {
          var len = 1,
            before =
              stream.pos == 1 ? " " : stream.string.charAt(stream.pos - 2);
          while (len < 3 && stream.eat(ch)) len++;
          var after = stream.peek() || " ";
          // See http://spec.commonmark.org/0.27/#emphasis-and-strong-emphasis
          var leftFlanking =
            !/\s/.test(after) &&
            (!punctuation.test(after) ||
              /\s/.test(before) ||
              punctuation.test(before));
          var rightFlanking =
            !/\s/.test(before) &&
            (!punctuation.test(before) ||
              /\s/.test(after) ||
              punctuation.test(after));
          var setEm = null,
            setStrong = null;
          if (len % 2) {
            // Em
            if (
              !state.em &&
              leftFlanking &&
              (ch === "*" || !rightFlanking || punctuation.test(before))
            )
              setEm = true;
            else if (
              state.em == ch &&
              rightFlanking &&
              (ch === "*" || !leftFlanking || punctuation.test(after))
            )
              setEm = false;
          }
          if (len > 1) {
            // Strong
            if (
              !state.strong &&
              leftFlanking &&
              (ch === "*" || !rightFlanking || punctuation.test(before))
            )
              setStrong = true;
            else if (
              state.strong == ch &&
              rightFlanking &&
              (ch === "*" || !leftFlanking || punctuation.test(after))
            )
              setStrong = false;
          }
          if (setStrong != null || setEm != null) {
            if (modeCfg.highlightFormatting)
              state.formatting =
                setEm == null
                  ? "strong"
                  : setStrong == null
                    ? "em"
                    : "strong em";
            if (setEm === true) state.em = ch;
            if (setStrong === true) state.strong = ch;
            var t = getType(state);
            if (setEm === false) state.em = false;
            if (setStrong === false) state.strong = false;
            return t;
          }
        } else if (ch === " ") {
          if (stream.eat("*") || stream.eat("_")) {
            // Probably surrounded by spaces
            if (stream.peek() === " ") {
              // Surrounded by spaces, ignore
              return getType(state);
            } else {
              // Not surrounded by spaces, back up pointer
              stream.backUp(1);
            }
          }
        }

        if (modeCfg.highlight) {
          if (ch === "=" && stream.eatWhile(ch)) {
            if (state.highlight) {
              // Remove highlight
              if (modeCfg.highlightFormatting) state.formatting = "highlight";
              var t = getType(state);
              state.highlight = false;
              return t;
            } else if (stream.match(/^[^\s>]/, false)) {
              // Add highlight
              state.highlight = true;
              if (modeCfg.highlightFormatting) state.formatting = "highlight";
              return getType(state);
            }
          } else if (ch === " ") {
            if (stream.match(/^==/, true)) {
              // Probably surrounded by space
              if (stream.peek() === " ") {
                // Surrounded by spaces, ignore
                return getType(state);
              } else {
                // Not surrounded by spaces, back up pointer
                stream.backUp(2);
              }
            }
          }
        }

        if (modeCfg.strikethrough) {
          if (ch === "~" && stream.eatWhile(ch)) {
            if (state.strikethrough) {
              // Remove strikethrough
              if (modeCfg.highlightFormatting)
                state.formatting = "strikethrough";
              var t = getType(state);
              state.strikethrough = false;
              return t;
            } else if (stream.match(/^[^\s]/, false)) {
              // Add strikethrough
              state.strikethrough = true;
              if (modeCfg.highlightFormatting)
                state.formatting = "strikethrough";
              return getType(state);
            }
          } else if (ch === " ") {
            if (stream.match("~~", true)) {
              // Probably surrounded by space
              if (stream.peek() === " ") {
                // Surrounded by spaces, ignore
                return getType(state);
              } else {
                // Not surrounded by spaces, back up pointer
                stream.backUp(2);
              }
            }
          }
        }

        if (
          modeCfg.emoji &&
          ch === ":" &&
          stream.match(/^(?:[a-z_\d+][a-z_\d+-]*|\-[a-z_\d+][a-z_\d+-]*):/)
        ) {
          state.emoji = true;
          if (modeCfg.highlightFormatting) state.formatting = "emoji";
          var retType = getType(state);
          state.emoji = false;
          return retType;
        }

        if (ch === " ") {
          if (stream.match(/^ +$/, false)) {
            state.trailingSpace++;
          } else if (state.trailingSpace) {
            state.trailingSpaceNewLine = true;
          }
        }

        return getType(state);
      }

      function linkInline(stream, state) {
        var ch = stream.next();

        if (ch === ">") {
          state.f = state.inline = inlineNormal;
          if (modeCfg.highlightFormatting) state.formatting = "link";
          var type = getType(state);
          if (type) {
            type += " ";
          } else {
            type = "";
          }
          return type + tokenTypes.linkInline;
        }

        stream.match(/^[^>]+/, true);

        return tokenTypes.linkInline;
      }

      function linkHref(stream, state) {
        // Check if space, and return NULL if so (to avoid marking the space)
        if (stream.eatSpace()) {
          return null;
        }
        var ch = stream.next();
        if (ch === "(" || ch === "[") {
          state.f = state.inline = getLinkHrefInside(ch === "(" ? ")" : "]");
          if (modeCfg.highlightFormatting) state.formatting = "link-string";
          state.linkHref = true;
          return getType(state);
        }
        return "error";
      }

      var linkRE = {
        ")": /^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.)*\))*?(?=\))/,
        "]": /^(?:[^\\\[\]]|\\.|\[(?:[^\\\[\]]|\\.)*\])*?(?=\])/,
      };

      function getLinkHrefInside(endChar) {
        return function (stream, state) {
          var ch = stream.next();

          if (ch === endChar) {
            state.f = state.inline = inlineNormal;
            if (modeCfg.highlightFormatting) state.formatting = "link-string";
            var returnState = getType(state);
            state.linkHref = false;
            return returnState;
          }

          stream.match(linkRE[endChar]);
          state.linkHref = true;
          return getType(state);
        };
      }

      function footnoteLink(stream, state) {
        if (stream.match(/^([^\]\\]|\\.)*\]:/, false)) {
          state.f = footnoteLinkInside;
          stream.next(); // Consume [
          if (modeCfg.highlightFormatting) state.formatting = "link";
          state.linkText = true;
          return getType(state);
        }
        return switchInline(stream, state, inlineNormal);
      }

      function footnoteLinkInside(stream, state) {
        if (stream.match("]:", true)) {
          state.f = state.inline = footnoteUrl;
          if (modeCfg.highlightFormatting) state.formatting = "link";
          var returnType = getType(state);
          state.linkText = false;
          return returnType;
        }

        stream.match(/^([^\]\\]|\\.)+/, true);

        return tokenTypes.linkText;
      }

      function footnoteUrl(stream, state) {
        // Check if space, and return NULL if so (to avoid marking the space)
        if (stream.eatSpace()) {
          return null;
        }
        // Match URL
        stream.match(/^[^\s]+/, true);
        // Check for link title
        if (stream.peek() === undefined) {
          // End of line, set flag to check next line
          state.linkTitle = true;
        } else {
          // More content on line, check if link title
          stream.match(
            /^(?:\s+(?:"(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+'|\((?:[^)\\]|\\.)+\)))?/,
            true,
          );
        }
        state.f = state.inline = inlineNormal;
        return tokenTypes.linkHref + " url";
      }

      var mode = {
        startState: function () {
          return {
            f: blockNormal,

            prevLine: { stream: null },
            thisLine: { stream: null },

            block: blockNormal,
            htmlState: null,
            indentation: 0,

            inline: inlineNormal,
            text: handleText,

            formatting: false,
            linkText: false,
            linkHref: false,
            linkTitle: false,
            code: 0,
            em: false,
            strong: false,
            header: 0,
            setext: 0,
            hr: false,
            taskList: false,
            list: false,
            listStack: [],
            quote: 0,
            trailingSpace: 0,
            trailingSpaceNewLine: false,
            strikethrough: false,
            highlight: false,
            emoji: false,
            fencedEndRE: null,
          };
        },

        copyState: function (s) {
          return {
            f: s.f,

            prevLine: s.prevLine,
            thisLine: s.thisLine,

            block: s.block,
            htmlState:
              s.htmlState && CodeMirror.copyState(htmlMode, s.htmlState),
            indentation: s.indentation,

            localMode: s.localMode,
            localState: s.localMode
              ? CodeMirror.copyState(s.localMode, s.localState)
              : null,

            inline: s.inline,
            text: s.text,
            formatting: false,
            linkText: s.linkText,
            linkTitle: s.linkTitle,
            linkHref: s.linkHref,
            code: s.code,
            em: s.em,
            strong: s.strong,
            strikethrough: s.strikethrough,
            highlight: s.highlight,
            emoji: s.emoji,
            header: s.header,
            setext: s.setext,
            hr: s.hr,
            taskList: s.taskList,
            list: s.list,
            listStack: s.listStack.slice(0),
            quote: s.quote,
            indentedCode: s.indentedCode,
            trailingSpace: s.trailingSpace,
            trailingSpaceNewLine: s.trailingSpaceNewLine,
            md_inside: s.md_inside,
            fencedEndRE: s.fencedEndRE,
          };
        },

        token: function (stream, state) {
          // Reset state.formatting
          state.formatting = false;

          if (stream != state.thisLine.stream) {
            state.header = 0;
            state.hr = false;

            if (stream.match(/^\s*$/, true)) {
              blankLine(state);
              return null;
            }

            state.prevLine = state.thisLine;
            state.thisLine = { stream: stream };

            // Reset state.taskList
            state.taskList = false;

            // Reset state.linkText
            state.linkText = false;

            // Reset state.trailingSpace
            state.trailingSpace = 0;
            state.trailingSpaceNewLine = false;

            if (!state.localState) {
              state.f = state.block;
              if (state.f != htmlBlock) {
                var indentation = stream
                  .match(/^\s*/, true)[0]
                  .replace(/\t/g, expandedTab).length;
                state.indentation = indentation;
                state.indentationDiff = null;
                if (indentation > 0) return null;
              }
            }
          }
          return state.f(stream, state);
        },

        innerMode: function (state) {
          if (state.block == htmlBlock)
            return { state: state.htmlState, mode: htmlMode };
          if (state.localState)
            return { state: state.localState, mode: state.localMode };
          return { state: state, mode: mode };
        },

        indent: function (state, textAfter, line) {
          if (state.block == htmlBlock && htmlMode.indent)
            return htmlMode.indent(state.htmlState, textAfter, line);
          if (state.localState && state.localMode.indent)
            return state.localMode.indent(state.localState, textAfter, line);
          return CodeMirror.Pass;
        },

        blankLine: blankLine,

        getType: getType,

        blockCommentStart: "<!--",
        blockCommentEnd: "-->",
        closeBrackets: "()[]{}''\"\"``",
        fold: "markdown",
      };
      return mode;
    },
    "xml",
  );

  CodeMirror.defineMIME("text/markdown", "markdown");

  CodeMirror.defineMIME("text/x-markdown", "markdown");
});
