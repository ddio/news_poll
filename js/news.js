'use strict';

function newsVM() {
	var self = this;

	this.newsList = ko.observableArray();
	this.tags = ko.observableArray();


	var feedUrl = 'http://spreadsheets.google.com/feeds/cells',
		feedParas = '/public/basic?alt=json-in-script',
		key='/0AknRKXEZD1LHdE0xajkzaGo2d3VqbVZqU0ZuM0tzNHc',
		parseFeed = function( resp ) {
			var cells = resp.feed.entry,
				totalCells = cells.length - ( cells.length % 3 ),
				indx = 3;

			while( indx < totalCells ) {
				var news = {};

				news.title = cells[indx].content.$t;
				news.tags = cells[indx+1].content.$t;
				news.notes = cells[indx+2].content.$t;
				news.checked = ko.observable( false );
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
});
