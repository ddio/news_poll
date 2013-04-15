'use strict';

function newsVM() {
	var self = this;

	this.name = ko.observable('');
	this.email = ko.observable('');
	this.newsList = ko.observableArray();
	this.tags = ko.observableArray();
	this.maxSelected = 3;
	this.curSelected = ko.observable(0);
	this.spaceLeave = ko.computed( function() { 
		return self.maxSelected - self.curSelected();
	});
	this.allowSubmit = ko.computed( function() {
		return 	self.name() && 
				self.email() &&
				self.spaceLeave() >= 0 &&
				self.curSelected() > 0;
	});
	this.prepareSubmit = function() {
		if( self.allowSubmit() ) {
			$('#summary').dialog('open');
		}
	};
	this.submit = function() {
		alert('還沒作到這邊呦～');
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
				news.showHideMsg = ko.computed( function() {
					return this.noteEnabled() ? 'less' : 'more';
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
		width: 800,
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
