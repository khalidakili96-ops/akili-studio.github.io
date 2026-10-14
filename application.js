(function(){
  var params=new URLSearchParams(window.location.search);
  if(params.get('submitted')==='true'){
    var form=document.querySelector('.application-form');
    var success=document.getElementById('application-success');
    if(form&&success){
      form.classList.add('is-complete');
      success.classList.add('is-visible');
      success.scrollIntoView({block:'start'});
      window.history.replaceState({},document.title,window.location.pathname);
    }
  }
})();


(function(){
  var form=document.querySelector('.application-form');
  if(!form)return;
  var fields=[].slice.call(form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]),select,textarea,input[type="checkbox"]'));
  var announcer=document.getElementById('application-announcement');
  var pending=false,complete=false;
  var submitButton=form.querySelector('button[type="submit"]');
  var submissionError=document.createElement('p');
  submissionError.className='form-error';
  submissionError.setAttribute('role','alert');
  submissionError.hidden=true;
  form.appendChild(submissionError);
  var getError=function(field){
    if(field.validity.valueMissing)return 'This field is required.';
    if(field.validity.typeMismatch)return 'Enter a valid email address.';
    if(field.validity.patternMismatch)return 'Enter the information in the requested format.';
    return 'Please check this field.';
  };
  var clearError=function(field){
    var id=field.id+'-error',error=document.getElementById(id);
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
    if(error)error.remove();
  };
  var showError=function(field){
    clearError(field);
    var message=document.createElement('p');
    message.id=field.id+'-error';
    message.className='form-error';
    message.textContent=getError(field);
    field.setAttribute('aria-invalid','true');
    field.setAttribute('aria-describedby',message.id);
    var container=field.closest('label')||field.parentElement;
    if(container)container.insertAdjacentElement('afterend',message);
    return message;
  };
  fields.forEach(function(field){
    field.addEventListener('input',function(){if(field.checkValidity())clearError(field);});
    field.addEventListener('change',function(){if(field.checkValidity())clearError(field);});
  });
  form.addEventListener('submit',function(event){
    if(pending||complete){event.preventDefault();return;}
    submissionError.hidden=true;
    var firstInvalid=null,invalidCount=0;
    fields.forEach(function(field){
      if(!field.checkValidity()){invalidCount++;if(!firstInvalid)firstInvalid=field;showError(field);}
      else clearError(field);
    });
    if(invalidCount){
      event.preventDefault();
      if(announcer)announcer.textContent=invalidCount===1?'Please correct the highlighted field.':('Please correct '+invalidCount+' highlighted fields.');
      if(firstInvalid)firstInvalid.focus({preventScroll:true});
      return;
    }
    if(announcer)announcer.textContent='Submitting your project application.';
    // Native POST remains the fallback when Fetch/FormData are unavailable.
    if(!window.fetch||!window.FormData)return;
    event.preventDefault();
    var payload={};
    new FormData(form).forEach(function(value,key){if(key!=='_next')payload[key]=value;});
    if(payload._honey)return;
    pending=true;
    form.setAttribute('aria-busy','true');
    if(submitButton)submitButton.disabled=true;
    var controller=window.AbortController?new AbortController():null;
    var timeout=controller?window.setTimeout(function(){controller.abort();},20000):null;
    var options={method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)};
    if(controller)options.signal=controller.signal;
    window.fetch('https://formsubmit.co/ajax/akilis.studios@gmail.com',options)
      .then(function(response){if(!response.ok)throw new Error('submission_failed');return response.json();})
      .then(function(result){
        if(!result||(result.success!==true&&result.success!=='true'))throw new Error('not_accepted');
        complete=true;
        form.classList.add('is-complete');
        var success=document.getElementById('application-success');
        if(success){
          success.classList.add('is-visible');
          success.setAttribute('tabindex','-1');
          success.focus();
          success.scrollIntoView({block:'start'});
        }
        if(announcer)announcer.textContent='Your project application has been received.';
        // Only service acceptance creates a lead, and only with analytics consent.
        try{if(window.AkiliAnalytics)window.AkiliAnalytics.trackAcceptedEnquiry();}catch(_){}
      })
      .catch(function(){
        submissionError.textContent='We could not confirm receipt of your enquiry. Your entries have been retained. Please contact akilis.studios@gmail.com before trying again.';
        submissionError.hidden=false;
        if(announcer)announcer.textContent='We could not confirm receipt. Your entries have been retained.';
      })
      .finally(function(){
        if(timeout)window.clearTimeout(timeout);
        pending=false;
        form.removeAttribute('aria-busy');
        if(submitButton)submitButton.disabled=complete;
      });
  });
  form.addEventListener('invalid',function(event){showError(event.target);},true);
})();
