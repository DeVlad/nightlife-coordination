var userId = '{{user.id}}';
var btnPlaceholders = document.getElementsByClassName('btn-placeholder');

// Get visitors count and ids
function getVisitorCount(url, btnPlaceholderId) {
    $.get(url, function (response) {        
        var visitorsCount = 0;
        var venueId = btnPlaceholderId.slice(4);
        
        if(response.count > 0) {
            visitorsCount = response.count;
            
            getVisitorNames(venueId, response.visitors);            
        }
                
        var btnTag = '<button type="button" class="btn btn-primary" onclick="visitVenue(\'' + venueId + '\', \'' + userId + '\',this)">Going <span id="btn-' + venueId + '" class="badge">' + visitorsCount +'</span></button>';
        
        $(btnPlaceholderId).append(btnTag);
    }, 'json');
}
    
for (var btnPlaceholder of btnPlaceholders) {
    var btnId = btnPlaceholder.id.slice(3);
    var link = window.location.origin + '/venue/'+ btnId + '/visitors';
    var btnPlaceholderId = '#ph-' + btnId;
    
    getVisitorCount(link, btnPlaceholderId);
}

// invoked onclick going button
function visitVenue(venueId, uid, button) {
    var url = window.location.origin + '/venue/'+ venueId + '/visitors';
    //console.log("VenueId:", venueId, "UserID:", uid);
    
    $.post(url, function (response) {
        //console.log("POST:", response)
        var id = '#btn-' + response.vid;
        var visitorsCount = response.count | 0;        
        
        $(id).text(visitorsCount);        
    }, 'json');
}

function getVisitorNames(venueId, visitors) {    
    var visitorsPlaceholderId = "#visitors-list";
    var output = '';
    
    visitors.forEach(function(visitor){
        output += visitor + ', ';
    });
    // TODOL fetch names from database
    $(visitorsPlaceholderId).text(output);
}
