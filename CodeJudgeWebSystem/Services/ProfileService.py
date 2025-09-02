from bs4 import BeautifulSoup

class ProfileService:
    def gatherProfileData(self, html):
        soup = BeautifulSoup(html, 'html.parser')
        profileDiv = soup.find('div', {'class': 'card card-body card-profile'})
        if not profileDiv:
            return {}

        nameTag = profileDiv.find('h3')
        name = nameTag.text.strip().split(" [")[0] if nameTag else ""

        emailTag = profileDiv.find('a', href=lambda x: x and x.startswith('mailto:'))
        email = emailTag.text.strip() if emailTag else ""

        details = {}
        for dl in profileDiv.find_all('dl'):
            dt = dl.find('dt')
            dd = dl.find('dd')
            if dt and dd:
                key = dt.text.strip().lower().replace(":", "").replace(" ", "_")
                value = dd.text.strip()
                details[key] = value

        lastLogin = ""
        for section in soup.find_all('section', class_='node_category'):
            for dl in section.find_all('dl'):
                dt = dl.find('dt')
                dd = dl.find('dd')
                if dt and dd:
                    key = dt.text.strip().lower().replace(":", "").replace(" ", "_")
                    details[key] = dd.text.strip()

        profileData = {
            "name": name,
            "email": email,
            **details
        }
        return profileData
