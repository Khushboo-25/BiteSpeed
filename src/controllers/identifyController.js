const prisma = require("../prisma");

exports.identify = async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "email or phoneNumber required" });
  }

  // Step 1: find contacts matching email or phone
  const matched = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email },
        { phoneNumber: phoneNumber }
      ]
    }
  });

  // Step 2: if none exist → create primary
  if (matched.length === 0) {

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
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: []
      }
    });
  }

  // Step 3: find primary contact
  let primary = matched.find(c => c.linkPrecedence === "primary");

  if (!primary) {
    primary = await prisma.contact.findFirst({
      where: { id: matched[0].linkedId }
    });
  }

  // Step 4: fetch ALL contacts of that identity
  const allContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primary.id },
        { linkedId: primary.id }
      ]
    }
  });

  const emails = new Set();
  const phones = new Set();
  const secondaryIds = [];

  allContacts.forEach(c => {
    if (c.email) emails.add(c.email);
    if (c.phoneNumber) phones.add(c.phoneNumber);
    if (c.linkPrecedence === "secondary") {
      secondaryIds.push(c.id);
    }
  });

  // Step 5: create secondary if new info appears
  if (
    (email && !emails.has(email)) ||
    (phoneNumber && !phones.has(phoneNumber))
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

    if (email) emails.add(email);
    if (phoneNumber) phones.add(phoneNumber);
  }

  // Step 6: final response
  res.json({
    contact: {
      primaryContactId: primary.id,
      emails: [...emails],
      phoneNumbers: [...phones],
      secondaryContactIds: secondaryIds
    }
  });
};