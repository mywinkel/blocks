<script lang="ts">let {checked=$bindable(false),onCheckedChange,disabled=false}:{checked?:boolean;onCheckedChange?:(v:boolean)=>void;disabled?:boolean}=$props();</script>
<input type="checkbox" class="size-4 rounded border-input accent-primary" bind:checked {disabled} onchange={()=>onCheckedChange?.(checked)}/>
