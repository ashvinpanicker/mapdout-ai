import Questionnaire from './components/Questionnaire';
// import ContactForm from './components/ContactForm'; // Removed ContactForm
import './Questionnaire.css'; // Styles for the questionnaire, located in src/
import './App.css'; // General app styles (if any)

function App() {
  return (
    <div className="App">
      <Questionnaire />
      {/* <hr style={{ margin: '40px 0' }} /> */} {/* Removed separator */}
      {/* <ContactForm /> */} {/* Removed ContactForm */}
    </div>
  );
}

export default App;
