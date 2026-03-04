const prisma = require("../prisma");

exports.identify = async (req, res) => {

    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: "email or phoneNumber required" });
    }

    const contacts = await prisma.contact.findMany({
        where: {
            OR: [
                { email: email },
                { phoneNumber: phoneNumber }
            ]
        }
    });

    if (contacts.length === 0) {

        const newContact = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkPrecedence: "primary"
            }
        });

        return res.json({
            contact: {
                primaryContactId: newContact.id,
                emails: [newContact.email],
                phoneNumbers: [newContact.phoneNumber],
                secondaryContactIds: []
            }
        });
    }

    let primary = contacts.find(c => c.linkPrecedence === "primary");

    if (!primary) {
        primary = contacts[0];
    }

    const existingEmails = new Set();
    const existingPhones = new Set();
    const secondaryIds = [];

    contacts.forEach(c => {
        if (c.email) existingEmails.add(c.email);
        if (c.phoneNumber) existingPhones.add(c.phoneNumber);

        if (c.linkPrecedence === "secondary") {
            secondaryIds.push(c.id);
        }
    });

    if (
        (email && !existingEmails.has(email)) ||
        (phoneNumber && !existingPhones.has(phoneNumber))
    ) {

        const newSecondary = await prisma.contact.create({
            data: {
                email,
                phoneNumber,
                linkedId: primary.id,
                linkPrecedence: "secondary"
            }
        });

        secondaryIds.push(newSecondary.id);

        if (email) existingEmails.add(email);
        if (phoneNumber) existingPhones.add(phoneNumber);
    }

    res.json({
        contact: {
            primaryContactId: primary.id,
            emails: [...existingEmails],
            phoneNumbers: [...existingPhones],
            secondaryContactIds: secondaryIds
        }
    });

};