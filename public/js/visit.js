var userId = '{{user.id}}';
var btnPlaceholders = document.getElementsByClassName('btn-placeholder');

function getVisitorCount(url, btnPlaceholderId) {
    $.get(url, function (response) {        
        var visitorsCount = 0;
        
        if(response.count > 0) {
            visitorsCount = response.count;
        }
        var venueId = btnPlaceholderId.slice(4);        
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
