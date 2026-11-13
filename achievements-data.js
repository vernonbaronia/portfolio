/* =========================================================
   Achievement page content
   ---------------------------------------------------------
   Edit this file to change headings and award lists. Photos
   themselves live in achievements-images/ and are picked up
   by the build script.

   After adding photos:  npm run achievements
   ========================================================= */

window.ACHIEVEMENT_CONTENT = {
	start: {
		school: 'KAJ Play and Learn Center',
		level: 'Day care & kindergarten',
		status: 'Graduate',
		logo: 'kaj',
		logoText: 'KAJ'
	},
	schools: [
		{
			id: 'elementary',
			stage: 'Elementary',
			school: 'Bolinao Christian School',
			logo: 'bcs',
			folder: 'ELEM',
			awards: [
				'Consistent Honor Student',
				'1st place Nutrition Month Poster Making Contest (2017)',
				'Division Science Contest, 4th place Spelling Bee (2018)'
			],
			emptyLabel: 'Certificates coming soon'
		},
		{
			id: 'junior-high',
			stage: 'Junior High School',
			school: 'Bolinao Integrated School',
			logo: 'bis',
			folder: 'JHS',
			awards: [
				'With Honors — Grade 9',
				'With High Honors — Grade 10',
				'Outstanding Performance in Arts',
				'JS Prom, Star of the Night',
				'Mr. Intramurals, 1st Runner-Up (2023–2024)',
				"Mr. Intramurals, People's Choice (2023–2024)",
				'Career Guidance, Best Dressed Young Career Person (2023)',
				'Project Runway — 1st Place'
			],
			emptyLabel: 'Certificates coming soon'
		},
		{
			id: 'senior-high',
			stage: 'Senior High School',
			school: 'Bolinao Integrated School',
			logo: 'bis',
			folder: 'SHS',
			awards: [
				'With High Honors — Grade 11',
				'With Highest Honors — Grade 12',
				'Makabansa Awardee',
				'Makatao Awardee',
				'Outstanding Performance in Quantitative Research',
				'Outstanding Performance in a Club/Organization (Journalism)',
				'Outstanding Performance in Communication Arts',
				'Outstanding Performance in Performing Arts',
				'Zumba King — 2025',
				'Lakandula ng Wika — 2024',
				'Mr. SDO 1 Athletic Association Meet Pangasinan — 2025',
				'Mr. SDO 1 ABM Ambassador — 2025'
			],
			emptyLabel: 'Certificates coming soon'
		},
		{
			id: 'college',
			stage: 'College',
			school: 'University of the Cordilleras',
			logo: 'uc',
			folder: 'COLLEGE',
			awards: ['Bagong Pilipinas Merit Scholarship Awardee'],
			status: 'Ongoing',
			emptyLabel: 'Scholar photo coming soon'
		}
	]
};
