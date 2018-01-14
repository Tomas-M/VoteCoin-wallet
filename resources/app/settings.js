
function ztrack_toggle()
{
   z_track=$('#ztrack').is(':checked')?1:0;
   storage_save('z_track',z_track);
}
