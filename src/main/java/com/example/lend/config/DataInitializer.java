package com.example.lend.config;

import com.example.lend.entity.User;
import com.example.lend.entity.Item;
import com.example.lend.repository.UserRepository;
import com.example.lend.repository.ItemRepository;
import com.example.lend.repository.BookingRepository;
import com.example.lend.repository.ReviewRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, 
                           ItemRepository itemRepository, 
                           BookingRepository bookingRepository,
                           ReviewRepository reviewRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.bookingRepository = bookingRepository;
        this.reviewRepository = reviewRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void run(String... args) throws Exception {
        // 1. Ensure seed users exist and are verified with proper roles
        User devUser = getOrCreateUser("developer@gmail.com", "developer", "Tech Park, Bangalore", 
                new java.util.HashSet<>(java.util.List.of(com.example.lend.entity.Role.USER, com.example.lend.entity.Role.OWNER, com.example.lend.entity.Role.ADMIN)));
        User neighborUser = getOrCreateUser("neighbour@gmail.com", "neighbour", "Indiranagar, Bangalore", 
                new java.util.HashSet<>(java.util.List.of(com.example.lend.entity.Role.USER, com.example.lend.entity.Role.OWNER)));
        User adminUser = getOrCreateUser("admin@gmail.com", "admin", "Admin HQ, Bangalore", 
                new java.util.HashSet<>(java.util.List.of(com.example.lend.entity.Role.USER, com.example.lend.entity.Role.ADMIN)));

        // 2. Seed 50 high-quality Indian marketplace items if table is empty or has old seed data
        if (itemRepository.count() < 40) {
            // Clear wishlists first to prevent foreign key errors on user_wishlist join table
            for (User user : userRepository.findAll()) {
                if (user.getWishlistedItems() != null && !user.getWishlistedItems().isEmpty()) {
                    user.getWishlistedItems().clear();
                    userRepository.save(user);
                }
            }
            reviewRepository.deleteAll();
            bookingRepository.deleteAll();
            itemRepository.deleteAll();

            // ==================== TOOLS ====================
            createItem("Stanley Claw Hammer (16 oz)", 
                       "Genuine Stanley claw hammer, heavy duty steel. Perfect for home DIY, hanging frames, or minor repairs. Please return after clean use.", 
                       30.0, 150.0, 200.0, "Tools", "/images/items/hammer.jpg", devUser, "Amit Sharma", "Mumbai", "Maharashtra");

            createItem("Bosch Cordless Electric Drill (12V)", 
                       "Powerful Bosch cordless drill with 2 rechargeable batteries and screwdriver bits. Ideal for wood, metal, and masonry drilling.", 
                       200.0, 1000.0, 1500.0, "Tools", "/images/items/drill.jpg", devUser, "Rohan Verma", "Bengaluru", "Karnataka");

            createItem("Taparia Multi-bit Screwdriver Set", 
                       "High-quality Taparia screwdriver kit with extension rods and 31 various bit types (Star, Flat, Torx). Magnetic tips make it easy to use.", 
                       40.0, 200.0, 300.0, "Tools", "/images/items/screwdriver.jpg", neighborUser, "Vikram Malhotra", "Delhi", "Delhi");

            createItem("Aluminium Foldable Ladder (6 Steps)", 
                       "Lightweight, highly stable 6-step aluminium ladder. Reach ceiling heights easily for cleaning, painting, or light bulb changes.", 
                       100.0, 500.0, 1000.0, "Tools", "/images/items/ladder.jpg", neighborUser, "Suresh Pillai", "Chennai", "Tamil Nadu");

            createItem("Karcher K2 Compact Pressure Washer", 
                       "High-pressure washer perfect for cleaning cars, bikes, balconies, and driveways. Comes with spray gun and 4m high-pressure hose.", 
                       250.0, 1200.0, 2000.0, "Tools", "/images/items/pressure_washer.jpg", devUser, "Deepak Joshi", "Pune", "Maharashtra");


            // ==================== ELECTRONICS ====================
            createItem("Epson EB-E01 XGA Projector", 
                       "High brightness 3LCD projector with HDMI and VGA ports. Perfect for movie nights, gaming sessions, or corporate presentations.", 
                       600.0, 3000.0, 5000.0, "Electronics", "/images/items/projector.jpg", devUser, "Kunal Sen", "Kolkata", "West Bengal");

            createItem("Canon EOS 1500D DSLR Camera", 
                       "Easy-to-use Canon DSLR with 18-55mm lens. Perfect for travel photography, vlogging, or family events. Comes with 16GB memory card, battery, and charger.", 
                       800.0, 4000.0, 8000.0, "Electronics", "/images/items/dslr_camera.jpg", devUser, "Ananya Iyer", "Kochi", "Kerala");

            createItem("JBL Charge 5 Bluetooth Speaker", 
                       "IP67 waterproof Bluetooth speaker with rich JBL Pro Sound and built-in powerbank. Up to 20 hours of playtime. Great for small gatherings.", 
                       150.0, 800.0, 1500.0, "Electronics", "/images/items/bluetooth_speaker.jpg", neighborUser, "Rahul Roy", "Mysuru", "Karnataka");

            createItem("Dell 24-inch Full HD IPS Monitor", 
                       "Dell thin-bezel IPS monitor with HDMI and VGA inputs. Perfect for setting up a temporary work-from-home space or dual-screen coding.", 
                       200.0, 1000.0, 3000.0, "Electronics", "/images/items/monitor.jpg", neighborUser, "Siddharth Rao", "Hyderabad", "Telangana");

            createItem("Mi Boost Pro 30000mAh Power Bank", 
                       "High capacity power bank with 18W fast charging and triple output ports. Keeps your devices powered during long travel or power cuts.", 
                       50.0, 250.0, 500.0, "Electronics", "/images/items/power_bank.jpg", devUser, "Pranav Mehta", "Ahmedabad", "Gujarat");


            // ==================== KITCHEN ====================
            createItem("Prestige Iris 750W Mixer Grinder", 
                       "Powerful 750-watt motor mixer grinder with 3 stainless steel jars and 1 juicer jar. Excellent for grinding idli/dosa batter or spices.", 
                       80.0, 400.0, 800.0, "Kitchen", "/images/items/mixer_grinder.jpg", devUser, "Meera Nair", "Madurai", "Tamil Nadu");

            createItem("Philips Viva Induction Cooktop", 
                       "Sleek glass cooktop with preset Indian cooking menus (roti, idli, milk, gravy). Electromagnetic induction makes cooking fast and safe.", 
                       100.0, 500.0, 1200.0, "Kitchen", "/images/items/induction_stove.jpg", devUser, "Sandhya Nair", "Coimbatore", "Tamil Nadu");

            createItem("Havells Grande 4L Air Fryer", 
                       "Healthy cooking with up to 85% less oil. 4-liter capacity, digital touch panel, and auto-off timer. Ideal for making samosas and fries.", 
                       180.0, 900.0, 2000.0, "Kitchen", "/images/items/air_fryer.jpg", neighborUser, "Neelam Gupta", "Noida", "Uttar Pradesh");

            createItem("Panasonic Automatic Electric Rice Cooker", 
                       "Cooks up to 1 kg of raw rice perfectly. Keep-warm function ensures your rice stays hot for hours. Clean, lightweight, and user-friendly.", 
                       70.0, 350.0, 800.0, "Kitchen", "/images/items/rice_cooker.jpg", neighborUser, "Rajesh Kannan", "Chennai", "Tamil Nadu");

            createItem("Samsung 23L Solo Microwave Oven", 
                       "Solo microwave for heating, defrosting, and simple cooking. Features ceramic enamel cavity which is easy to clean. Includes glass turntable.", 
                       150.0, 750.0, 2500.0, "Kitchen", "/images/items/microwave.jpg", devUser, "Divya Deshmukh", "Pune", "Maharashtra");


            // ==================== FURNITURE ====================
            createItem("Supreme Plastic Armchairs (Set of 4)", 
                       "Sturdy, stackable plastic chairs with armrests. Great for hosting extra guests at home for family get-togethers or prayer sessions.", 
                       40.0, 200.0, 500.0, "Furniture", "/images/items/plastic_chairs.jpg", devUser, "Ramesh Kumar", "Kochi", "Kerala");

            createItem("Nilkamal Foldable Plastic Table", 
                       "Convenient rectangular foldable table. Lightweight and easy to set up inside or on balconies for study, dining, or outdoor snacks.", 
                       60.0, 300.0, 800.0, "Furniture", "/images/items/foldable_table.jpg", devUser, "Karthik Raja", "Mysuru", "Karnataka");

            createItem("Decornation Solid Wood Study Table", 
                       "Wooden writing desk with drawer. Spacious tabletop to keep a laptop, notebook, and lamp. Sleek design, perfect for short-term study needs.", 
                       120.0, 600.0, 2000.0, "Furniture", "/images/items/study_table.jpg", neighborUser, "Arjun Das", "Kolkata", "West Bengal");

            createItem("Green Soul Ergonomic Office Chair", 
                       "High-back mesh chair with lumbar support, adjustable height, and comfortable armrests. Perfect for long hours of working or studying.", 
                       150.0, 850.0, 2500.0, "Furniture", "/images/items/office_chair.jpg", neighborUser, "Pooja Hegde", "Bengaluru", "Karnataka");

            createItem("DeckUp 3-Tier Wooden Bookshelf", 
                       "Compact 3-tier wooden shelf to organize books, files, or decorative items. Fits easily into corners. Cleaned and ready to use.", 
                       80.0, 400.0, 1200.0, "Furniture", "/images/items/bookshelf.jpg", devUser, "Shalini Sharma", "Delhi", "Delhi");


            // ==================== VEHICLES ====================
            createItem("Hero Sprint Next 24T Gear Cycle", 
                       "Dual suspension 18-speed mountain bicycle. Ideal for daily commuting or exploring city trails. Comes with front/rear mudguards.", 
                       100.0, 550.0, 1500.0, "Vehicles", "/images/items/bicycle.jpg", devUser, "Vijay Sethupathi", "Chennai", "Tamil Nadu");

            createItem("Ather 450X Gen 3 Electric Scooter", 
                       "Ather electric scooter in excellent condition. Eco and Sport modes, range up to 85 km on full charge. Charger included. DL copy required.", 
                       400.0, 2200.0, 5000.0, "Vehicles", "/images/items/electric_scooter.jpg", devUser, "Nikhil Gowda", "Bengaluru", "Karnataka");

            createItem("Montra Madrock 29T Mountain Bike", 
                       "High performance mountain bike with 21-speed Shimano gears and front zoom suspension. Great for weekend trail rides. Helmet provided.", 
                       150.0, 800.0, 2000.0, "Vehicles", "/images/items/mountain_bike.jpg", neighborUser, "Ajith Kumar", "Kochi", "Kerala");

            createItem("Decathlon Btwin Tilt 120 Folding Bike", 
                       "6-speed folding bicycle. Folds in 30 seconds, fits easily into a car trunk. Perfect for park rides or city exploration.", 
                       120.0, 650.0, 1800.0, "Vehicles", "/images/items/folding_bike.jpg", neighborUser, "Varun Dhawan", "Mumbai", "Maharashtra");

            createItem("Firefox Target 21-Speed Hybrid Bike", 
                       "Lightweight alloy frame hybrid bicycle. Smooth rolling tires for pavement and road. Well maintained, brakes and gears are tuned.", 
                       140.0, 750.0, 2000.0, "Vehicles", "/images/items/hybrid_bike.jpg", devUser, "Aditya Roy", "Pune", "Maharashtra");


            // ==================== SPORTS ====================
            createItem("DSC Complete Premium Cricket Kit", 
                       "Full kit including English Willow bat, leg guards, batting gloves, helmet, elbow guard, and kitbag. Perfect for weekend matches.", 
                       200.0, 1000.0, 2000.0, "Sports", "/images/items/cricket_kit.jpg", devUser, "Sachin Tendulkar", "Mumbai", "Maharashtra");

            createItem("YONEX Carbonex 8000 Set (2 Rackets)", 
                       "Pair of Yonex rackets with 3 plastic shuttlecocks and a net. Perfect for playing in housing society compounds or local parks.", 
                       80.0, 400.0, 800.0, "Sports", "/images/items/badminton_set.jpg", devUser, "Saina Nehwal", "Hyderabad", "Telangana");

            createItem("Nivia Storm Football (Size 5)", 
                       "Sturdy rubber football with air pump and needle. Excellent grip and durability for playing on turf or ground.", 
                       30.0, 150.0, 300.0, "Sports", "/images/items/football.jpg", neighborUser, "Sunil Chhetri", "Bengaluru", "Karnataka");

            createItem("Rubx Chrome Dumbbells (15kg Pair)", 
                       "Set of two 15 kg chrome dumbbells. Non-slip grip, hexagonal design prevents rolling. Perfect for setting up a short-term home gym.", 
                       100.0, 500.0, 1200.0, "Sports", "/images/items/gym_dumbbells.jpg", neighborUser, "Hrithik Roshan", "Mumbai", "Maharashtra");

            createItem("Boldfit Yoga Mat (6mm TPE)", 
                       "Eco-friendly, slip-resistant TPE yoga mat with carrying strap. Cushions joints during workouts, yoga, or pilates. Sanitized after every use.", 
                       30.0, 150.0, 350.0, "Sports", "/images/items/yoga_mat.jpg", devUser, "Shilpa Shetty", "Pune", "Maharashtra");


            // ==================== BOOKS ====================
            createItem("Mechanical Engineering Sem-5 Textbook Set", 
                       "Set of 5 core textbooks for 5th Semester Mechanical Engineering (Thermal, Fluid, Machine Design, etc.). Clean pages, no highlighting.", 
                       50.0, 250.0, 500.0, "Books", "/images/items/engineering_books.jpg", devUser, "Rahul Gupta", "Chennai", "Tamil Nadu");

            createItem("M. Laxmikanth Indian Polity (Latest Edition)", 
                       "The bible for Indian Polity by M. Laxmikanth. Extremely useful for UPSC Civil Services preparation. Very neat, clean, and latest edition.", 
                       40.0, 200.0, 400.0, "Books", "/images/items/upsc_books.jpg", devUser, "IAS Aspirant", "Delhi", "Delhi");

            createItem("NCERT Class 10 Complete Textbook Set", 
                       "Set of Class 10 NCERT books including Maths, Science, Social Science, and English. Perfect for CBSE board exam prep.", 
                       30.0, 150.0, 300.0, "Books", "/images/items/ncert_sets.jpg", neighborUser, "Priya Sharma", "Madurai", "Tamil Nadu");

            createItem("RS Aggarwal Quantitative Aptitude", 
                       "Quantitative Aptitude and Logical Reasoning by RS Aggarwal. Essential for bank exams, placements, and MBA prep. Kept in good condition.", 
                       25.0, 120.0, 250.0, "Books", "/images/items/aptitude_books.jpg", neighborUser, "Aakash Singh", "Hyderabad", "Telangana");

            createItem("Best of Chetan Bhagat Novel Set (5 Books)", 
                       "Paperback editions of 3 Mistakes of My Life, 2 States, Half Girlfriend, Five Point Someone, and One Indian Girl. Good light read.", 
                       20.0, 100.0, 200.0, "Books", "/images/items/fiction_books.jpg", devUser, "Rinki Sen", "Coimbatore", "Tamil Nadu");


            // ==================== CAMPING GEAR ====================
            createItem("Quechua Arpenaz 2-Person Camping Tent", 
                       "Waterproof, wind-resistant 2-person dome tent from Decathlon. Easy setup in under 5 minutes. Includes pegs and carrying bag.", 
                       150.0, 750.0, 1500.0, "Camping Gear", "/images/items/tent.jpg", devUser, "Trekker Anand", "Kochi", "Kerala");

            createItem("Coleman Mummy Sleeping Bag (-5°C)", 
                       "Insulated, ultra-warm mummy sleeping bag suitable for high altitude camping. Comfort range up to -5 degrees. Freshly dry-cleaned.", 
                       80.0, 400.0, 1000.0, "Camping Gear", "/images/items/sleeping_bag.jpg", devUser, "Himalayan Nomad", "Delhi", "Delhi");

            createItem("Portable Butane Camping Gas Stove", 
                       "Compact, windproof butane gas stove with automatic ignition. Perfect for outdoor cooking during treks and car camping. Gas canister not included.", 
                       70.0, 350.0, 800.0, "Camping Gear", "/images/items/camping_stove.jpg", neighborUser, "Camp Chef", "Pune", "Maharashtra");

            createItem("Decathlon Forclaz Trekking Pole (Pair)", 
                       "Adjustable anti-shock hiking poles. Reduces impact on knees during descents. Ergonomic foam grip. Essential for steep treks.", 
                       40.0, 200.0, 500.0, "Camping Gear", "/images/items/trekking_pole.jpg", neighborUser, "Mountain Goat", "Coimbatore", "Tamil Nadu");

            createItem("Quechua Rechargeable Camping Lantern", 
                       "Rechargeable LED camping lantern with multiple brightness modes and USB output to charge phones. Up to 10 hours runtime on low mode.", 
                       30.0, 150.0, 400.0, "Camping Gear", "/images/items/camping_lantern.jpg", devUser, "Forest Camp", "Mysuru", "Karnataka");


            // ==================== HOME APPLIANCES ====================
            createItem("Philips EasySpeed 1000W Steam Iron", 
                       "Steam iron with non-stick soleplate and continuous steam output. Easily removes stubborn creases from cotton and linen fabrics.", 
                       40.0, 200.0, 400.0, "Home Appliances", "/images/items/iron_box.jpg", devUser, "Lalitha Prasad", "Chennai", "Tamil Nadu");

            createItem("Eureka Forbes Trendy Zip Vacuum", 
                       "Compact and powerful 1000W canister vacuum cleaner with dust bag full indicator and multiple attachments for sofas, carpets, and corners.", 
                       120.0, 600.0, 1500.0, "Home Appliances", "/images/items/vacuum_cleaner.jpg", devUser, "Sanjay Dutt", "Mumbai", "Maharashtra");

            createItem("Kent Ultra Storage UV Water Purifier", 
                       "Active UV water purifier with storage tank. Ideal for houses with tap water supply. Ready to connect and plug in.", 
                       150.0, 750.0, 2000.0, "Home Appliances", "/images/items/water_purifier.jpg", neighborUser, "Harish Kumar", "Madurai", "Tamil Nadu");

            createItem("Usha Janome Dream Stitch Sewing Machine", 
                       "Compact automatic sewing machine with 7 built-in stitches and 14 stitch functions. Perfect for alterations, quilting, and crafts.", 
                       150.0, 700.0, 2500.0, "Home Appliances", "/images/items/sewing_machine.jpg", neighborUser, "Geeta Ben", "Ahmedabad", "Gujarat");

            createItem("Usha Maxx Air 400mm Pedestal Fan", 
                       "High-speed pedestal fan with auto-oscillation and height adjustment. Perfect to beat the summer heat or for outdoor gatherings.", 
                       50.0, 250.0, 600.0, "Home Appliances", "/images/items/pedestal_fan.jpg", devUser, "Vinay Kumar", "Hyderabad", "Telangana");


            // ==================== EVENT ITEMS ====================
            createItem("Sony MHC-V13 High-Power Audio System", 
                       "All-in-one party speaker with Bluetooth, USB, and CD. Features party lights, mic input for karaoke, and massive bass. Ideal for house parties.", 
                       400.0, 2000.0, 4000.0, "Event Items", "/images/items/party_speakers.jpg", devUser, "DJ Karan", "Pune", "Maharashtra");

            createItem("LED Fairy String Lights (Set of 10)", 
                       "Warm white fairy lights, each 10 meters long. Waterproof copper wire, great for Diwali, Christmas, birthdays, or balcony decorations.", 
                       50.0, 200.0, 300.0, "Event Items", "/images/items/decorative_lights.jpg", devUser, "Rishi Kapoor", "Mumbai", "Maharashtra");

            createItem("Event Pop-up Gazebo Tent (10x10 ft)", 
                       "Waterproof pop-up canopy tent. Erects in minutes without tools. Excellent shelter for birthday parties, exhibition stalls, or garden events.", 
                       300.0, 1500.0, 3000.0, "Event Items", "/images/items/foldable_canopy.jpg", neighborUser, "Alok Nath", "Delhi", "Delhi");

            createItem("Stainless Steel Buffet Server (Set of 3)", 
                       "Elegant stainless steel chafing dishes with fuel holders. Keeps food warm during family functions or home parties. Easy to clean.", 
                       150.0, 700.0, 1500.0, "Event Items", "/images/items/chafing_dish.jpg", neighborUser, "Caterer Mohan", "Kochi", "Kerala");

            createItem("Singing Machine Wireless Dual Mic System", 
                       "Dual wireless microphone set with receiver. Plugs into any speaker or amplifier. Perfect for home karaoke, family singing, or speeches.", 
                       100.0, 500.0, 1000.0, "Event Items", "/images/items/karaoke_mic.jpg", devUser, "Sonu Nigam", "Bengaluru", "Karnataka");
            
            System.out.println("Seeded database with default users and 50 realistic Indian household rental items.");
        }
    }

    private User getOrCreateUser(String email, String password, String address, java.util.Set<com.example.lend.entity.Role> roles) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(roles);
                return userRepository.save(user);
            }
            return user;
        }
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setAddress(address);
        user.setVerified(true);
        user.setRoles(roles);
        return userRepository.save(user);
    }

    private void createItem(String name, String description, Double price, Double weeklyRate, Double securityDeposit,
                            String category, String imageUrl, User owner, String ownerName, String city, String state) {
        Item item = new Item();
        item.setName(name);
        item.setDescription(description);
        item.setPrice(price);
        item.setWeeklyRate(weeklyRate);
        item.setSecurityDeposit(securityDeposit);
        item.setCategory(category);
        item.setImageUrl(imageUrl);
        item.setOwner(owner);
        item.setOwnerName(ownerName);
        item.setCity(city);
        item.setState(state);
        item.setAvailable(true);
        itemRepository.save(item);
    }
}
