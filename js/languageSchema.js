let closeChars = {
	"[": "]",
	"<": ">",
	"(": ")",
	"{": "}",
	"#": "#",
	"\"": "\"",
	"'": "'",
}

let languages = {
	bottery: {
		name: "Bottery",
		mainType: "Map",

		types: {
			"Map": {
				"grammar": "tracery.BasicGrammar",
				"states": "dictionary of State",
				"exits": "ExitList",
				"initialBlackboard": "dictionary of Value",
			},
			"State": {
				"onEnterDoOne": "array of STRING(conditionalActions)",
				"chips": "array of STRING(tracery.rule)",
				"onEnter*": "STRING(actions)",
				"onExit*": "STRING(actions)",
				"onEnterSay*": "STRING(tracery.rule)",
				"exits": "ExitList",
			},

			"ExitList": ["Exit", "array of Exit"],
			"Exit": "STRING(exit)"

		},

		contextMap: {
			// condition condition condition =>target postaction postaction
			
			"exit": {
				"lexPriority": [{
					split: "->",
				}, {
					split: " ",
				}, {
					split: ":",
				}, {
					split: "=",
				}],
				"toContext": {
					"(": "expression",
					"'": "templateMatcher",
					'"': "templateMatcher"
				}
			},
			"plainText": {
				"lexPriority": [],
				"toContext": {
				}
			},
			"templateMatcher": {
				"lexPriority": [],
				"toContext": {
					"#": "plainText",
				}
			},

			"action": {
				"lexPriority": [],
				"toContext": {
					"(": "expression",
				}
			},

			"expression": {

				"toContext": {
					"(": "expression",
					"[": "path"

				},

				clearWhiteSpace: true,
			},

		}
	},

	tracery: {
		name: "Tracery",

		mainType: "Grammar",
		types: {
			"Grammar": ["BasicGrammar", "MetadataGrammar"],
			"BasicGrammar": "dictionary of Ruleset",
			"MetadataGrammar": {
				"name*": "STRING",
				"date*": "STRING(DATE)",
				"id*": "STRING(ID)",
				"modifiers*": "dictionary of FUNCTION",
				"grammar": "BasicGrammar"
			},

			"Ruleset": ["Rule", "array of Rule", "ConditionalRule"],
			"ConditionalRule": {
				"condition": "STRING(expression)",
				"ifTrue": "Ruleset",
				"ifFalse": "Ruleset"
			},
			"FallDownRuleMatch": {
				"condition": "STRING(expression)",
				"rule": "Ruleset"
			},
			"FallDownRule": {
				"falldowns": "array of FallDownRuleMatch",
				"default": "Ruleset"
			},
			"Rule": "STRING(rule)",

		},


		grammar: {
			"rule": ["[for i in [0,4] '#ruleSection#']"],
		},

		contextMap: {
			rule: {
				"lexPriority": [],
				"toContext": {
					"#": "tag",
					"[": "action"
				}
			},

			innerRule: {
				"lexPriority": [],
				"toContext": {
					"#": "tag",
					"[": "action",
					"{": "innerRule"
				}
			},


			// #foo#
			// #foo()#
			// #foo.bar#
			// #foo.bar(baz).foo()#
			// #foo{key}#
			// #/person/name/{count}#
			// #foo./translate/language()#

			tag: {
				"lexPriority": [{
					split: ".",
					parseAs: "address"
				}],
				"toContext": {
					"(": "expression",
					"[": "action"
				}
			},

			ruleGenerator: {
				lexPriority: [{
					split: " where ",
				}, {
					split: " else ",
				}, {
					split: " in ",
				}],
				"toContext": {
					"(": "expression",
					"[": "ruleGenerator",
					"\"": "innerRule",
					"\'": "innerRule",
					"#": "tag",
					"[": "action",
					"{": "innerRule"

				}
			},

			action: {
				"lexPriority": [{
					split: ":",
				}, {
					split: ",",
				}],

				"toContext": {
					"(": "expression",
					"[": "ruleGenerator",
					"\"": "innerRule",
					"\'": "innerRule",
					"#": "tag",
					"[": "action",
					"{": "innerRule"

				}
			},
			expression: {
				"lexPriority": [{
						split: ",",
					}, {
						split: "||",
					}, {
						split: "&&",
					}, {
						split: ">=",
					}, {
						split: "<=",
					}, {
						split: "<",
					}, {
						split: ">",
					}, {
						split: "!=",
					}, {
						split: "==",
					}, {
						split: "+",
					}, {
						split: "=",
					},
					// subtraction: filter out any "-" that are actually negation
					{
						split: "-",
						condition: (s, index) => {

							// where are -?
							// "x-5" "...)-5"
							// "%-5" "=== -5" "> -5" "!-5" "&&-5" "||-5"
							// get the previous non-space
							let s2 = s.substring(0, index);
							s2 = s2.trim();
							let c2 = s.charAt(s2.length - 1)


							if ("%^*/+-=><!&|".indexOf(c2) !== -1)
								return false;
							return true

						}
					}, {
						split: "*",
					}, {
						split: "/",
					}, {
						split: "^",
					}, {
						split: "%",
					}, {
						split: "!",
					}, {
						split: "-",
					},
				],

				"toContext": {
					"(": "expression",
					"[": "action",
					"\"": "innerRule",
					"#": "tag",
					"[": "action",
					"{": "innerRule"

				},

				clearWhiteSpace: true,

			},


			address: {

			},



			// Push:
			//  [foo:bar] 
			//  [foo:Mr. {#adj#}]
			// Function
			//  [join(for x in animal, ',')]
			//  [f()]
			// Rule generator:
			//  [animal]
			//  ["cow"]
			//  ["cow", "pig", "bunny", "#animal#"]
			//  ["rule" for x in b]
			//  [for x in b "rule"]
			//  [if (expression) "rule" else "rule"]
			//  [if (expression) generator else generator]
			//  [for x in b "rule" where (expression) ]

		}


	},


}

// Clone
languages.bottery.contextMap.expression.lexPriority = languages.tracery.contextMap.expression.lexPriority