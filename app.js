const API = "http://localhost:5000/api";

// LOGIN
async function login(){
  const res = await fetch(API+"/auth/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      email:email.value,
      password:password.value
    })
  });

  const data = await res.json();

  localStorage.setItem("token",data.token);

  alert("Login Success");
  location.href="dashboard.html";
}

// CREATE ALERT
async function createAlert(){
  const res = await fetch(API+"/alerts",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":localStorage.getItem("token")
    },
    body:JSON.stringify({
      title:title.value,
      amount:amount.value,
      expiry:expiry.value
    })
  });

  const data = await res.json();

  if(data.upgrade){
    alert("Upgrade required!");
  } else {
    alert("Alert created");
  }
}