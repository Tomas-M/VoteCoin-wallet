
var z_track = storage_load('z_track');
$('#ztrack').prop('checked',z_track);

function ztrack_toggle()
{
   z_track=$('#ztrack').is(':checked')?1:0;
   storage_save('z_track',z_track);
}
