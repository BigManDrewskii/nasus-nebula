(function(){"use strict";const i="https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js";let n=null,s=null;async function u(){return n||s||(s=(async()=>{importScripts(i);const r=await self.loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.27.2/full/",stdout:()=>{},stderr:()=>{}});return n=r,r})(),s)}const a=`
import sys, io as _io
_stdout_buf = _io.StringIO()
_stderr_buf = _io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf
`,y=`
_out = _stdout_buf.getvalue()
_err = _stderr_buf.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`;self.addEventListener("message",async r=>{const{type:_,id:d,code:c}=r.data;if(_==="run")try{const t=await u();await t.runPythonAsync(a);let e;try{await t.runPythonAsync(c)}catch(o){e=o instanceof Error?o.message:String(o)}await t.runPythonAsync(y);const l=String(t.globals.get("_out")??""),f=String(t.globals.get("_err")??"");self.postMessage({type:"result",id:d,stdout:l,stderr:f,error:e})}catch(t){const e=t instanceof Error?t.message:String(t);self.postMessage({type:"result",id:d,stdout:"",stderr:"",error:e})}}),self.postMessage({type:"ready"})})();
