const prisma = require("../prisma");

exports.identify = async (req, res) => {

  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "email or phoneNumber required" });
  }

  // Find matching contacts
  const matched = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email || undefined },
        { phoneNumber: phoneNumber || undefined }
      ]
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  // No existing contact
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
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: []
      }
    });
  }

  // Find primary contact (oldest)
  let primary = matched.find(c => c.linkPrecedence === "primary");

  if (!primary) {
    primary = await prisma.contact.findUnique({
      where: { id: matched[0].linkedId }
    });
  }

  // Fetch all contacts belonging to this identity
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

  // Create secondary if new information
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

  res.json({
    contact: {
      primaryContactId: primary.id,
      emails: [...emails],
      phoneNumbers: [...phones],
      secondaryContactIds: secondaryIds
    }
  });

};