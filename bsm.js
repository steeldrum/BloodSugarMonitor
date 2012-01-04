/*

BloodSugarMonitor/
bsm.js

tjs 100824

file version 1.04 

release version 1.05

*/
var db;
var jQT = $.jQTouch({
    icon: 'bsm-icon.png',
    startupScreen: 'bsm-startup.png',
    statusBar: 'black'
});

$(document).ready(function() {
    $('#createEntry form').submit(createEntry);
    $('#settings form').submit(saveSettings);
    $('#settings').bind('pageAnimationStart', loadSettings);
    $('#average').bind('pageAnimationStart', loadAverages);
    $('#truncate').bind('pageAnimationStart', loadTruncates);
    $('#dates li a').click(function(){
        var dayOffset = this.id;
        var date = new Date();
        date.setDate(date.getDate() - dayOffset);
        sessionStorage.currentDate = date.getMonth() + 1 + '/' + date.getDate() + '/' + date.getFullYear();
        refreshEntries();
    });
    var shortName = 'Glucose';
    var version = '1.0';
    var displayName = 'Glucose';
    var maxSize = 65536;
    db = openDatabase(shortName, version, displayName, maxSize);
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS entries ' +
                ' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, ' +
                ' date DATE NOT NULL, food TEXT NOT NULL, ' +
                ' hour INTEGER NOT NULL, ampm INTEGER NOT NULL, glucose INTEGER NOT NULL );'
            );
        }
    );
});

function saveSettings() {
    localStorage.age = $('#age').val();
    localStorage.target = $('#target').val();
    localStorage.pmtarget = $('#pmtarget').val();
    localStorage.weight = $('#weight').val();
    jQT.goBack();
    return false;
}

function loadSettings() {
    $('#age').val(localStorage.age);
    $('#target').val(localStorage.target);
    $('#pmtarget').val(localStorage.pmtarget);
    $('#weight').val(localStorage.weight);
}

function loadAverages() {
    $('#ageDisplay').val(localStorage.age);
    $('#targetDisplay').val(localStorage.target);
    $('#pmtargetDisplay').val(localStorage.pmtarget);
    $('#weightDisplay').val(localStorage.weight);
     countDays();
}

function loadTruncates() {
     countTruncateDays();
}

function refreshEntries() {
    var currentDate = sessionStorage.currentDate;
    $('#date h1').text(currentDate);
    $('#date ul li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM entries WHERE date = ? ORDER BY ampm, hour;',
                [currentDate],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#entryTemplate').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#date ul');
    //alert("refresh ampm " + row.ampm);
                        var html = '<span class="ampmtoggle"><input type="checkbox" name="ampm" checked="checked" /></span>';
                        //tjs 101206
                      //if (row.ampm == 1) {
                      if (row.ampm == 0) {
                      html = '<span class="ampmtoggle"><input type="checkbox" name="ampm" /></span>';
                      }

    //alert("refresh html " + html);
                       newEntryRow.find('.ampmtoggle').html(html);
                        newEntryRow.find('.hour').text(row.hour);
                        newEntryRow.find('.label').text(row.food);
                        newEntryRow.find('.glucose').text(row.glucose);
                        newEntryRow.find('.delete').click(function(){
                            var clickedEntry = $(this).parent();
                            var clickedEntryId = clickedEntry.data('entryId');
                            deleteEntryById(clickedEntryId);
                            clickedEntry.slideUp();
                        });
                    }
                },
                errorHandler
            );
        }
    );
}

function defaultCreateEntry() {
 //alert("defaultCreateEntry");
   var now = new Date();
    var hour = now.getHours();
    var am = false;
    if (hour <= 11)
        am = true;

//alert("defaultCreateEntry hour " + hour + " am? " + am);

//jqia 22
//query for ampm element
    var ampmElement = $('#ampm')[0];
    
    var optionElement;
    //set appropriate default for AM or PM
//and query for appropriate option that comprises the default selection
    if (am) {
        ampmElement.checked = 'checked';
        optionElement = $('#food option[value=abstinent]')[0];
    }
    else {
        ampmElement.checked = '';
        optionElement = $('#food option[value=observent]')[0];
    }        
//alert("defaultCreateEntry optionElement value " + optionElement.value);
//assign default selection
    optionElement.selected = 'selected';
    
}

function createEntry() {
    var date = sessionStorage.currentDate;
    var hour = $('#hour').val();
    var torf = $('#ampm').val();
    //var ampm = torf? 0 : 1;
    //tjs 101206
    //var ampm = torf? 1 : 0;
    var ampm = 0;
    if (torf == "on")
    	ampm = 1;
    //alert("create torf " + torf + " ampm " + ampm);
    var glucose = $('#glucose').val();
    var food = $('#food').val();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO entries (date, hour, ampm, glucose, food) VALUES (?, ?, ?, ?, ?);',
                [date, hour, ampm, glucose, food],
                function(){
                    refreshEntries();
                    jQT.goBack();
                },
                errorHandler
            );
        }
    );
    return false;
}

function errorHandler(transaction, error) {
    alert('Oops. Error was '+error.message+' (Code '+error.code+')');
    return true;
}

function deleteEntryById(id) {
    db.transaction(
        function (transaction) {
            transaction.executeSql('DELETE FROM entries WHERE id=?;', [id], null, errorHandler);
        }
    );
}

/*
db.readTransaction(function (t) {
  t.executeSql('SELECT title, author FROM docs WHERE id=?', [id], function (t, data) {
    report(data.rows[0].title, data.rows[0].author);
  });
});

*/
function countDays() {
    var count = 0;
    var lastDate = "";

    var am = 1;
    var pm = 0;
        db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM entries WHERE ampm = ? or ampm = ? ORDER BY date;',
                [am, pm],
                function (transaction, result) {
       //alert("countDays result.rows.length " + result.rows.length);
                   for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
			var date = row.date;
			//alert("countDays date " + date + " lastDate " + lastDate);
			if (date != lastDate) {
				lastDate = date;
			++count;
			//alert("countDays Am or PM " + count);
			}
      //alert("countDays Am or PM " + count);
                    }
		    $('#daysDisplay').val(count);
		    refreshAverages(count);
                },
                errorHandler
            );
        }
    );
       //alert("final countDays " + count);
}

function refreshAverages(count) {
var limit = count;
var cumAMGlucose = 0;
var amCount = 0;
var cumPMGlucose = 0;
var pmCount = 0;
    var am = 1;
    var pm = 0;
    var lastDate = "";
     db.transaction(
        function(transaction) {
            transaction.executeSql(
               'SELECT * FROM entries WHERE ampm = ? or ampm = ? ORDER BY date DESC;',
                [am, pm],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                    if (limit < 0)
                    break;
                        var row = result.rows.item(i);
                        var date = row.date;
                        var glucose = row.glucose;
                        //alert("refreshAverages limit " + limit + " date " + date + " glucose " + glucose);
                        if (row.ampm == 1) {
                      cumAMGlucose += glucose;
                      amCount++;
                      } else {
                      cumPMGlucose += glucose;
                      pmCount++;
                      }
			if (date != lastDate) {
				lastDate = date;
			--limit;
			//alert("countDays Am or PM " + count);
			}

                       
                    }
		       var amAverage = cumAMGlucose/amCount;
    var pmAverage = cumPMGlucose/pmCount;
    var combinedAverage = (cumAMGlucose + cumPMGlucose)/(amCount + pmCount);
       $('#amaverage').val(amAverage);
    $('#pmaverage').val(pmAverage);
    $('#combinedaverage').val(combinedAverage);

                },
                errorHandler
            );
        }
    );

}

function countTruncateDays() {
    var count = 0;
    var lastDate = "";

    var am = 1;
    var pm = 0;
        db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM entries WHERE ampm = ? or ampm = ? ORDER BY date;',
                [am, pm],
                function (transaction, result) {
       //alert("countDays result.rows.length " + result.rows.length);
                   for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
			var date = row.date;
			//alert("countDays date " + date + " lastDate " + lastDate);
			if (date != lastDate) {
				lastDate = date;
			++count;
			//alert("countDays Am or PM " + count);
			}
      //alert("countDays Am or PM " + count);
                    }
		    $('#daysTruncate').val(count);
		    //refreshAverages(count);
                },
                errorHandler
            );
        }
    );
       //alert("final countDays " + count);
}

function truncate(count) {
    var limit = count;
    var ids = new Array();
    var entries = new Array();
    var am = 1;
    var pm = 0;
    var date = "";
    //e.g. 3
    //alert("truncate count " + count);
    db.transaction(
        function(transaction) {
            transaction.executeSql(
               'SELECT * FROM entries WHERE ampm = ? or ampm = ?;',
                [am, pm],
                function (transaction, result) {
                //e.g. 7 (a week)
                 //alert("truncate result.rows.length " + result.rows.length);
                   for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        date = row.date;
                        //alert("truncate date " + date);
                        var str;
                        str = date.split('/');
                        //alert("truncate str.length " + str.length);
                        //id, year, month, day, am or pm, hour, food, glucose level
                        var entry = new Entry(row.id, str[2], str[0], str[1], row.ampm, row.hour, row.food, row.glucose);
                        entries.push(entry);
                    }
                    entries.sort(sortEntryByDate);
                    entries.reverse();
                    var length = entries.length;
                    var lastEntry = new Entry(0, 1971, 1,1,1,1,'',1);
                    //alert("truncate entries size (length) " + length);
                    for (var i = 0; i < length; i++) {
                        if (limit < 0) {
                            //alert("truncate id to delete " + entries[i].id);
                            ids.push(entries[i].id);
                        }

                        if (entries[i].year != lastEntry.year ||
                            entries[i].month != lastEntry.month ||
                            entries[i].day != lastEntry.day) {
                                lastEntry.year = entries[i].year;
                                lastEntry.month = entries[i].month;
                                lastEntry.day = entries[i].day;
                                --limit;
                        }                    
                    }
                    var length = ids.length;
                    
                    //alert("truncate ids size (length) " + length);
                    for (var i = 0; i < length; i++) {
                        var id = ids[i];
                            //alert("truncate id being deleted " + id);
                        //deleteEntryById(ids[i]);
                        transaction.executeSql('DELETE FROM entries WHERE id=?;', [id], null, errorHandler); 
                    }
                    
                },
                errorHandler
            );
	    /*
	    var length = ids.length();
	    for (var i = 0; i < length; i++) {
		    deleteEntryById(ids[i]);
	    }
	    */
        }
    );

}

     function Entry(id, year, month, day, ampm, hour, food, glucose) {
        this.id = id;
        this.year = year;
        this.month = month;
        this.day = day;
        this.ampm = ampm;
        this.hour = hour;
        this.food = food;
        this.glucose = glucose;
    }

function sortEntryByDate(a,b) {
    var yearDiff = a.year - b.year;
    if (yearDiff != 0) {
        return yearDiff;
    } else {
        var monthDiff = a.month - b.month;
        if (monthDiff != 0) {
            return monthDiff;
        } else {
            var dayDiff = a.day - b.day;
            return dayDiff;
        }
    }
    return 0;
}


