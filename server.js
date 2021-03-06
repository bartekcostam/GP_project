const express = require('express');
const calendar = require('./public/js/calendar');
const app = express();
const db = require('./database')
const nodemailer = require('nodemailer');
const Vonage = require('@vonage/server-sdk')
require('dotenv').config()

console.log(process.env.TEKST)

app.set('view engine', 'ejs')

app.use(express.static('./public'))

app.use(express.json())

app.use(express.urlencoded())

app.listen(process.env.port)

app.get('/', (req, res) =>{

res.render('index')
})

app.get('/umowWizyte', (req, res) =>{

    res.render('umowWizyte')
})


app.get('/lekarze', (req, res) =>{

    res.render('lekarze')
})

app.get('/kontakt', (req, res) =>{

    res.render('kontakt')
})
app.get('/zaloguj', (req, res) =>{

    res.render('zaloguj')
})

app.get('/admin', async(req, res) =>{

    const pracownicy = await db.promise().query(`SELECT * FROM users`)

    //console.log(pracownicy[0])

    res.render('admin',{pracownicy: pracownicy[0]})
})

app.post('/admin/pracownik', async(req, res) =>{

    console.log(req.body)
    const {imie,nazwisko,specjalizacja,nr_telefonu} = req.body
    const iloscPracownikow = await db.promise().query(`SELECT id_pracownika FROM users`)
    const id_pracownika = (iloscPracownikow[0].length) + 1 
    //Troszke ciezko mi bylo poradzic sobie z przeslaniem wartosci null do bazy by ta samo inkrementowala pole id_pracownika i przypisywala odpowiednie id
    //console.log(id_pracownika)
    try{
        await db.promise().query(`INSERT INTO users VALUES('${id_pracownika}','${imie}','${nazwisko}','${specjalizacja}','${nr_telefonu}')`)
        res.status(201)
    }
    catch (err){
        console.log(err)
    }
})

app.delete('/admin/pracownik/usun/:id', async(req, res) =>{
        console.log(req.params.id)
        const usun = req.params.id
        try{
            await db.promise().query(`DELETE FROM users WHERE id_pracownika='${usun}'`)
            res.status(200).send({msg: 'Usunieto pracownika'})
            console.log("Server - usunieto pracownika")
        }
        catch (err){
            console.log(err)
        }
        


})

app.get('/admin/ustawienia', (req, res) => {
    res.render('ustawienia')
})

app.get('/kalendarz', async(req, res) =>{

    const year = req.query.year || 2022;
    const months = ["Styczen", "Luty", "Marzec", "Kwiecien", "Maj", "Czerwiec", "Lipiec",
    "Sierpie??", "Wrzesie??", "Pazdziernik", "Listopad", "Grudzien"];

    

    const results = await db.promise().query(`SELECT * FROM wizyty`)



    const daty = await db.promise().query(`SELECT name,surname,date, DATE_FORMAT(date,'%e/%m/%Y') AS sformatowanaData  FROM wizyty ORDER BY date DESC LIMIT 0,14`)

   console.log(daty[0])

    const wyniki = results[0]
    
    //res.status(200)
    //console.log(wyniki)
    //let obj1 = json.parse(wyniki)
    //console.log(obj1)
    let str = JSON.stringify(wyniki[0].date)
    //console.log(str)
    res.render("kalendarz.ejs",{calendar: calendar(year),months,year,wyniki: wyniki,daty: daty[0]});
})

app.post('/zalogujUsr', (req, res) =>{

    console.log(req.body)

    if(req.body.username === 'admin' && req.body.password === 'password'){
        console.log("Admin sie loguje")
        res.redirect('/admin')
    }
   else {
       res.send("Brak dostepu")
   }
    
    
})

app.post('/umow', (req, res) =>{
    console.log(req.body)
    

    const {name, surname,email,pesel,lekarz,phone_nr,date , time, message} = req.body
    try{
        db.promise().query(`INSERT INTO wizyty VALUES('${name}','${surname}','${email}','${pesel}','${lekarz}','${phone_nr}','${date}','${time}','${message}')`)
        res.status(201).send({msg: 'Utworzono wizyte'})
    }
    catch (err){
        console.log(err)
    }
    //res.send("Dziekujem :)")

    //===================================================================
    //sms

    const vonage = new Vonage({
        apiKey: process.env.apiKey,
        apiSecret: process.env.apiSecret
      })
      
      const from = "mediExpert"
      const to = process.env.nr_telefonu
      const text = 'Zarezerwowales wizyte na ' + date +" godzina" + time
      
      vonage.message.sendSms(from, to, text, (err, responseData) => {
          if (err) {
              console.log(err);
          } else {
              if(responseData.messages[0]['status'] === "0") {
                  console.log("Wiadomosc SMS wyslana");
              } else {
                  console.log(`Blad wyslania wiadomosci: ${responseData.messages[0]['error-text']}`);
              }
          }
      })
})


app.post('/kontakt/mail', (req, res) =>{
    
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.userNameGmail, // generated ethereal user
          pass: process.env.passwordGmail // generated ethereal password
        },
      });
      console.log(req.body)

      const mailOptions ={
          from: req.body.email,
          to: process.env.docelowyEmail,
          subject: "Mail z formy kontaktowej"+ " Numer telefonu:  " + req.body.phone_nr,
          text: req.body.message
      }
      
      transporter.sendMail(mailOptions, (error, info) => {
          if (error){
              console.log(error)
          }
          else{
              console.log("Mail wyslany")
              res.send("Wyslono")
          }
      })
      


})