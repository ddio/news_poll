'use strict';

function newsVM() {
	var self = this;

	this.name = ko.observable('');
	this.email = ko.observable('');
	this.newsList = ko.observableArray();
	this.tags = ko.observableArray();
	this.maxSelected = 10;
	this.curSelected = ko.observable(0);
	this.spaceLeave = ko.computed( function() { 
		return self.maxSelected - self.curSelected();
	});
	this.nameChecker = ko.computed( function() {
		return self.curSelected() == 0 || !!self.name();
	});
	this.emailChecker = ko.computed( function() {
		var emailReg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
		return self.curSelected() == 0 || self.email().match( emailReg );
	});
	this.userInvalid = ko.computed( function() {
		return !self.nameChecker() || !self.emailChecker();
	});
	this.allowSubmit = ko.computed( function() {
		return 	!self.userInvalid() && 
				self.spaceLeave() >= 0 &&
				self.curSelected() > 0;
	});
	this.prepareSubmit = function() {
		if( self.allowSubmit() ) {
			$('#summary').dialog('open');
			$('#summary').scrollTop(0);
		}
	};
	
	this.cancel = function() {
			$('#summary').dialog('close');
	}

	var formUrl = 'https://docs.google.com/forms/d/',
		formKey = '1fAKVvzLFP32DFAaHK-PN94a7cjQsffuoCw0dMIflKmM',
		formTail = '/formResponse';

	this.submit = function() {
		var selectedNews = [];

		$.each( self.newsList(), function( indx, news ) {
			if( news.checked() ) {
				selectedNews.push( indx+1 );
			}
		});

		$.ajax( formUrl+formKey+formTail, {
			type: 'POST',
			dataType: 'xml',
			data: {
				'entry.54981871': self.name(),
				'entry.242987477': self.email(),
				'entry.695619516': selectedNews
			},
			traditional: true,
			complete: function( resp ) {
				alert('資料已送出， 謝謝您的大力支持、參與。');
				$('#summary').dialog('close');
			}
		});
	}

	var feedUrl = 'http://spreadsheets.google.com/feeds/cells',
		feedParas = '/public/basic?alt=json-in-script',
		key='/0AknRKXEZD1LHdE0xajkzaGo2d3VqbVZqU0ZuM0tzNHc',
		parseFeed = function( resp ) {
			var cells = resp.feed.entry,
				totalCells = cells.length - ( cells.length % 3 ),
				indx = 3;

			while( indx < totalCells ) {
				var news = {},
					checkedCache = ko.observable( false );

				news.title = cells[indx].content.$t;
				news.tags = cells[indx+1].content.$t;
				news.notes = cells[indx+2].content.$t;
				news.checked = ko.computed({
					read: function() { return this(); },
					write: function( v ) {
						if( v ) {
							self.curSelected( self.curSelected()+1 );
						} else {
							self.curSelected( self.curSelected()-1 );
						}
						this( v );
					}
				}, checkedCache); 
				news.thisNoteEnabled = ko.observable( false );
				news.noteEnabled = ko.computed( function() {
					return this.thisNoteEnabled();
				}, news);
				news.msg = ko.computed( function() {
					return this.noteEnabled() ? '' : '展開詳細說明';
				}, news);
				news.switchNotes = function( thisNews ) {
					thisNews.thisNoteEnabled( !thisNews.thisNoteEnabled() );
				};

				news.tags = news.tags.replace(/ /g,'').split(',');
				$.each( news.tags, function(i,tag) {
					self.tags[tag] = ++self.tags[tag] || 0;
				});

				self.newsList.push( news );
				indx += 3;
			}
		};

	$.ajax( feedUrl+key+'/1'+feedParas, {
		dataType: 'jsonP',
		success: parseFeed
	});

}

$(function() {

	ko.applyBindings( new newsVM() );
	$('input.required').placeholder();
	$('#news-form').validate();

	$('#summary').dialog({
		autoOpen: false,
		dialogClass: 'summary-dia',
		width: 900,
		show: 'slow',
		height: $(window).height() - 160
	});

	Sammy( function() {

		this.get( /.*\/poll/, function() {
			$('#descriptions').hide();
			$('#rules').hide();
			$('#news-form-wrapper').show();
			$('#poll-info').show();
		});
		this.get('', function() {
			$('#descriptions').show();
			$('#rules').show();
			$('#news-form-wrapper').hide();
			$('#poll-info').hide();
		});

	}).run();
});
