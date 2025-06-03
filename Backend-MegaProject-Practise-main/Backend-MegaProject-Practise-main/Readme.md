Node mailer -> Transporter
Mailtrap -> Warehouse
Mailgen -> Gereator

// install docker command on local machine
docker run --name backendDB -d -p 27017:27017 mongo

delete mongodb record :

mongosh

use backendDB

# delete commnad

db.user.deleteOne({ email: "<email>" })

# check :

db.user.findOne({ email: "<email>" })
