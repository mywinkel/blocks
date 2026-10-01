<script lang="ts">
 import type {MediaPickerProps,SelectedMedia} from '../contract';
 let {url='',onselect}:MediaPickerProps=$props();
 function choose(){
  const port=(globalThis as typeof globalThis & {__cmsSettingsPort?:MessagePort}).__cmsSettingsPort;
  if(!port)return;
  const id=crypto.randomUUID();
  function receive(event:MessageEvent){if(event.data.type!=='media-result'||event.data.id!==id)return;port?.removeEventListener('message',receive);if(event.data.media)onselect(event.data.media as SelectedMedia);}
  port.addEventListener('message',receive);port.postMessage({type:'media-request',id});
 }
</script>
<button type="button" class="rounded-md border px-3 py-2 text-sm" onclick={choose}>{url?'Change image':'Choose image'}</button>
