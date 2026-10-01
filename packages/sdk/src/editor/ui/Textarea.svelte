<script lang="ts">import type {HTMLTextareaAttributes} from "svelte/elements";import type {Snippet} from "svelte";let {class:classes='',children,value=$bindable(),...rest}:HTMLTextareaAttributes & {children?:Snippet}=$props();</script>
<textarea bind:value class={`rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-50 ${classes}`} {...rest}></textarea>
